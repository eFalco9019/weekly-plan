import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileId } from '../types'
import { supabase as defaultClient } from './supabaseClient'
import {
  readPlan,
  writePlanRaw,
  planId,
  parsePlanId,
  localPlanIds,
  emitRemotePlanChange,
  type StoredDayPlan,
} from './planStore'

/**
 * Sincronizzazione dei giorni del piano con Supabase (tabella day_plans,
 * vedi supabase/migrations). La copia locale resta quella su cui l'app
 * lavora; qui:
 * - ogni modifica locale entra in una coda e parte in background;
 * - all'avvio si scarica tutto e si caricano i giorni presenti solo sul
 *   dispositivo (anche quelli salvati prima del collegamento);
 * - le modifiche degli altri dispositivi arrivano in tempo reale;
 * - tra due versioni dello stesso giorno vince la più recente;
 * - offline la coda resta salvata e riparte quando torna la rete.
 */

export type SyncStatus = 'locale' | 'connessione' | 'sincronizzato' | 'offline'

interface DayPlanRow {
  profile_id: ProfileId
  date: string
  week: number
  day_type: 'ON' | 'OFF'
  state: StoredDayPlan['state']
  note: string
  updated_at: string
  updated_by: string | null
}

const PENDING_KEY = 'weekly-plan:sync-pending'
const DEVICE_KEY = 'weekly-plan:device-id'

let client: SupabaseClient | null = defaultClient
let status: SyncStatus = client ? 'connessione' : 'locale'
const statusListeners = new Set<(s: SyncStatus) => void>()
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushing = false

/** Solo per i test: sostituisce il client Supabase. */
export function __setSyncClient(c: SupabaseClient | null) {
  client = c
  status = c ? 'connessione' : 'locale'
}

export function getSyncStatus(): SyncStatus {
  return status
}

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

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = `dev-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return 'dev-sconosciuto'
  }
}

function loadPending(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function savePending(pending: Set<string>) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify([...pending]))
  } catch {
    // ignorato: la coda resta in memoria fino al prossimo tentativo
  }
}

function time(iso: string | undefined): number {
  const t = iso ? Date.parse(iso) : NaN
  return Number.isNaN(t) ? -Infinity : t
}

function scheduleFlush(delayMs = 600) {
  if (!client) return
  clearTimeout(flushTimer)
  flushTimer = setTimeout(() => void flush(), delayMs)
}

/** Da chiamare dopo ogni salvataggio locale di un giorno. */
export function queueUpload(profile: ProfileId, date: string) {
  if (!client) return
  const pending = loadPending()
  pending.add(planId(profile, date))
  savePending(pending)
  scheduleFlush()
}

/** Invia al database i giorni in coda. */
export async function flush(): Promise<void> {
  if (!client || flushing) return
  const pending = loadPending()
  if (pending.size === 0) {
    if (status !== 'offline') setStatus('sincronizzato')
    return
  }
  flushing = true
  const rows: DayPlanRow[] = []
  for (const id of pending) {
    const { profile, date } = parsePlanId(id)
    let plan = readPlan(profile, date)
    if (!plan) {
      pending.delete(id)
      continue
    }
    if (!plan.updatedAt) {
      // Giorno salvato prima del collegamento: riceve ora un'ora di modifica,
      // altrimenti non risulterebbe mai inviato e resterebbe in coda.
      plan = { ...plan, updatedAt: new Date().toISOString() }
      writePlanRaw(profile, date, plan)
    }
    rows.push({
      profile_id: profile,
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
      const { error } = await client.from('day_plans').upsert(rows, { onConflict: 'profile_id,date' })
      if (error) throw error
    }
    // Esce dalla coda solo ciò che non è cambiato di nuovo durante l'invio.
    const now = loadPending()
    for (const row of rows) {
      const plan = readPlan(row.profile_id, row.date)
      if (!plan || (plan.updatedAt ?? '') === row.updated_at) now.delete(planId(row.profile_id, row.date))
    }
    for (const id of pending) if (!rows.some((r) => planId(r.profile_id, r.date) === id)) now.delete(id)
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
function applyRemote(row: DayPlanRow): void {
  const local = readPlan(row.profile_id, row.date)
  const remoteTime = time(row.updated_at)
  if (!Number.isFinite(remoteTime)) return // riga senza ora valida: ignorata
  const localTime = time(local?.updatedAt)
  if (local && localTime >= remoteTime) {
    // La versione locale è più nuova: sarà lei a sovrascrivere il database.
    if (localTime > remoteTime) queueUpload(row.profile_id, row.date)
    return
  }
  writePlanRaw(row.profile_id, row.date, {
    week: row.week,
    dayType: row.day_type,
    state: row.state,
    note: row.note ?? '',
    updatedAt: new Date(remoteTime).toISOString(),
  })
  emitRemotePlanChange(row.profile_id, row.date)
}

/** Scarica tutto, carica i giorni presenti solo qui, poi invia la coda. */
export async function pullAll(): Promise<void> {
  if (!client) return
  try {
    const { data, error } = await client.from('day_plans').select('*')
    if (error) throw error
    const remoteIds = new Set<string>()
    for (const row of (data ?? []) as DayPlanRow[]) {
      remoteIds.add(planId(row.profile_id, row.date))
      applyRemote(row)
    }
    const pending = loadPending()
    for (const id of localPlanIds()) if (!remoteIds.has(id)) pending.add(id)
    savePending(pending)
    await flush()
    if (loadPending().size === 0) setStatus('sincronizzato')
  } catch {
    setStatus('offline')
    scheduleFlush(15_000)
  }
}

/** Avvia la sincronizzazione (una volta, all'apertura dell'app). Restituisce la funzione per fermarla. */
export function startSync(): () => void {
  const c = client
  if (!c) {
    setStatus('locale')
    return () => {}
  }
  setStatus('connessione')
  void pullAll()

  const me = deviceId()
  const channel = c
    .channel('day_plans')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'day_plans' }, (payload) => {
      const row = payload.new as DayPlanRow | undefined
      if (!row || !row.profile_id || row.updated_by === me) return
      applyRemote(row)
    })
    .subscribe((s) => {
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('offline')
    })

  // Al ritorno della rete o quando l'app torna in primo piano (telefono
  // sbloccato) si recupera ciò che è cambiato nel frattempo.
  const catchUp = () => void pullAll()
  const onVisible = () => {
    if (document.visibilityState === 'visible') catchUp()
  }
  window.addEventListener('online', catchUp)
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    void c.removeChannel(channel)
    window.removeEventListener('online', catchUp)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
