import { beforeAll, expect, test, vi } from 'vitest'

// Ambiente minimo del browser: localStorage, window, document.
const store = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  },
  window: { addEventListener() {}, removeEventListener() {} },
  document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
})

const db = new Map<string, Record<string, unknown>>()
let onChange: (p: { new: Record<string, unknown> }) => void = () => {}
const fake = {
  from: () => ({
    upsert: async (rows: Record<string, unknown>[]) => {
      for (const r of rows) db.set(`${r.user_id}|${r.date}`, r)
      return { error: null }
    },
    select: async () => ({ data: [...db.values()], error: null }),
  }),
  channel: () => {
    const ch = {
      on: (_t: string, _f: unknown, cb: typeof onChange) => ((onChange = cb), ch),
      subscribe: () => ch,
    }
    return ch
  },
  removeChannel: async () => {},
}

let sync: typeof import('../lib/sync')
let store2: typeof import('../lib/planStore')
let plan: typeof import('../hooks/useDayPlan')
const { pianoRiferimento } = await import('../data/piano')

beforeAll(async () => {
  vi.useFakeTimers()
  sync = await import('../lib/sync')
  store2 = await import('../lib/planStore')
  plan = await import('../hooks/useDayPlan')
  sync.__setSyncClient(fake as never)
  store2.setStoreUser('u1')
  sync.startSync('u1')
  await vi.runAllTimersAsync()
})

test('una modifica locale arriva al database', async () => {
  plan.setNoteForDate(pianoRiferimento, '2026-11-18', 'basket')
  await vi.runAllTimersAsync()
  expect(db.get('u1|2026-11-18')?.note).toBe('basket')
  expect(sync.getSyncStatus()).toBe('sincronizzato')
})

test('una modifica più recente da un altro dispositivo sostituisce la copia locale', async () => {
  const remote = { ...db.get('u1|2026-11-18')!, note: 'nuoto', updated_at: new Date(Date.now() + 60_000).toISOString(), updated_by: 'altro' }
  const seen: string[] = []
  store2.onRemotePlanChange((d) => seen.push(d))
  onChange({ new: remote })
  expect(store2.readPlan('2026-11-18')?.note).toBe('nuoto')
  expect(seen).toEqual(['2026-11-18'])
})

test('una versione remota più vecchia non sovrascrive, e il database riceve la più nuova', async () => {
  onChange({ new: { ...db.get('u1|2026-11-18')!, note: 'vecchia', updated_at: '2020-01-01T00:00:00Z', updated_by: 'altro' } })
  expect(store2.readPlan('2026-11-18')?.note).toBe('nuoto')
  await vi.runAllTimersAsync()
  expect(db.get('u1|2026-11-18')?.note).toBe('nuoto')
})

test('salvare lo stesso contenuto non genera invii', async () => {
  const before = JSON.stringify(db.get('u1|2026-11-18'))
  const day = store2.readPlan('2026-11-18')!
  plan.saveDayPlan('2026-11-18', { ...day })
  await vi.runAllTimersAsync()
  expect(JSON.stringify(db.get('u1|2026-11-18'))).toBe(before)
})
