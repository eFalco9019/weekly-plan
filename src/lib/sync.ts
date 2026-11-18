import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultClient } from './supabaseClient'
import { readPlan, writePlanRaw, localDates, emitRemotePlanChange, type StoredDayPlan } from './planStore'

/**
 * Sincronizzazione dei giorni dell'utente con la tabella `days`:
 * - ogni modifica locale entra in una coda e parte in background;
 * - all'avvio si scarica tutto e si caricano i giorni presenti solo qui;
 * - le modifiche degli altri dispositivi arrivano in tempo reale;
 * - tra due versioni dello stesso giorno vince la più recente;
 * - offline la coda resta salvata e riparte quando torna la rete.
 * La RLS del database fa vedere a ciascuno solo i propri giorni.
 */

export type SyncStatus = 'locale' | 'connessione' | 'sincronizzato' | 'offline'

interface DayRow {
  user_id: string
  date: string
  week: number
  day_type: 'ON' | 'OFF'
  state: StoredDayPlan['state']
  note: string
  updated_at: string
  updated_by: string | null
}

let client: SupabaseClient | null = defaultClient
let userId: string | null = null
let status: SyncStatus = 'locale'
const statusListeners = new Set<(s: SyncStatus) => void>()
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushing = false

/** Solo per i test: sostituisce il client Supabase. */
export function __setSyncClient(c: SupabaseClient | null) {
  client = c
}

export const getSyncStatus = () => status

export function onSyncStatus(listener: (s: SyncStatus) => void): () => void {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

function setStatus(next: SyncStatus) {
  if (next === status) return
  status = next
  for (const l of statusListeners) l(next)
}

const deviceId = (() => {
  let id: string | null = null
  return () => {
    if (id) return id
    try {
      id = localStorage.getItem('weekly-plan:device-id')
      if (!id) localStorage.setItem('weekly-plan:device-id', (id = `dev-${Math.random().toString(36).slice(2, 10)}`))
    } catch {
      id = 'dev-sconosciuto'
    }
    return id
  }
})()

const pendingKey = () => `weekly-plan:${userId}:pending`

function loadPending(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(pendingKey()) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function savePending(pending: Set<string>) {
  try {
    localStorage.setItem(pendingKey(), JSON.stringify([...pending]))
  } catch {
    // la coda resta in memoria fino al prossimo tentativo
  }
}

function time(iso: string | undefined): number {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isNaN(t) ? -Infinity : t
}

function scheduleFlush(delayMs = 600) {
  if (!client || !userId) return
  clearTimeout(flushTimer)
  flushTimer = setTimeout(() => void flush(), delayMs)
}

/** Da chiamare dopo ogni salvataggio locale di un giorno. */
export function queueUpload(date: string) {
  if (!client || !userId) return
  const pending = loadPending()
  pending.add(date)
  savePending(pending)
  scheduleFlush()
}

/** Invia al database i giorni in coda. */
async function flush(): Promise<void> {
  if (!client || !userId || flushing) return
  const pending = loadPending()
  if (pending.size === 0) {
    if (status !== 'offline') setStatus('sincronizzato')
    return
  }
  flushing = true
  const rows: DayRow[] = []
  for (const date of pending) {
    let plan = readPlan(date)
    if (!plan) continue
    if (!plan.updatedAt) writePlanRaw(date, (plan = { ...plan, updatedAt: new Date().toISOString() }))
    rows.push({
      user_id: userId,
      date,
      week: plan.week,
      day_type: plan.dayType,
      state: plan.state,
      note: plan.note ?? '',
      updated_at: plan.updatedAt as string,
      updated_by: deviceId(),
    })
  }
  try {
    if (rows.length > 0) {
      const { error } = await client.from('days').upsert(rows, { onConflict: 'user_id,date' })
      if (error) throw error
    }
    // Esce dalla coda solo ciò che non è cambiato di nuovo durante l'invio.
    const now = loadPending()
    for (const date of pending) {
      const sent = rows.find((r) => r.date === date)
      if (!sent || (readPlan(date)?.updatedAt ?? '') === sent.updated_at) now.delete(date)
    }
    savePending(now)
    setStatus('sincronizzato')
    if (now.size > 0) scheduleFlush()
  } catch {
    setStatus('offline')
    scheduleFlush(15_000)
  } finally {
    flushing = false
  }
}

/** Applica una riga del database alla copia locale se è più recente. */
function applyRemote(row: DayRow): void {
  const remoteTime = time(row.updated_at)
  if (!Number.isFinite(remoteTime)) return
  const localTime = time(readPlan(row.date)?.updatedAt)
  if (localTime >= remoteTime) {
    // La versione locale è più nuova: sarà lei a sovrascrivere il database.
    if (localTime > remoteTime) queueUpload(row.date)
    return
  }
  writePlanRaw(row.date, {
    week: row.week,
    dayType: row.day_type,
    state: row.state,
    note: row.note ?? '',
    updatedAt: new Date(remoteTime).toISOString(),
  })
  emitRemotePlanChange(row.date)
}

/** Scarica tutto, carica i giorni presenti solo qui, poi invia la coda. */
export async function pullAll(): Promise<void> {
  if (!client || !userId) return
  try {
    const { data, error } = await client.from('days').select('*')
    if (error) throw error
    const remote = new Set<string>()
    for (const row of (data ?? []) as DayRow[]) {
      remote.add(row.date)
      applyRemote(row)
    }
    const pending = loadPending()
    for (const date of localDates()) if (!remote.has(date)) pending.add(date)
    savePending(pending)
    await flush()
  } catch {
    setStatus('offline')
    scheduleFlush(15_000)
  }
}

/** Avvia la sincronizzazione per l'utente collegato. Restituisce la funzione per fermarla. */
export function startSync(uid: string): () => void {
  const c = client
  userId = uid
  if (!c) {
    setStatus('locale')
    return () => {}
  }
  setStatus('connessione')
  void pullAll()

  const me = deviceId()
  const channel = c
    .channel(`days:${uid}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'days', filter: `user_id=eq.${uid}` }, (payload) => {
      const row = payload.new as DayRow | undefined
      if (row?.date && row.updated_by !== me) applyRemote(row)
    })
    .subscribe((s) => {
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('offline')
    })

  // Al ritorno della rete o dell'app in primo piano si recupera ciò che è cambiato.
  const catchUp = () => void pullAll()
  const onVisible = () => document.visibilityState === 'visible' && catchUp()
  window.addEventListener('online', catchUp)
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    clearTimeout(flushTimer)
    void c.removeChannel(channel)
    window.removeEventListener('online', catchUp)
    document.removeEventListener('visibilitychange', onVisible)
    userId = null
    setStatus('locale')
  }
}
