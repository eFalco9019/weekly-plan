import type { DayType, ProfileId } from '../types'
import type { DayState } from '../hooks/useDayPlan'

/**
 * Copia locale dei giorni del piano (localStorage del browser). È la
 * copia su cui l'app lavora sempre, anche offline; src/lib/sync.ts la
 * tiene allineata con Supabase quando il progetto è collegato.
 */
export interface StoredDayPlan {
  week: number
  dayType: DayType
  state: DayState
  /** Nota libera del giorno (es. tipo di allenamento fatto). */
  note?: string
  /** Ora dell'ultima modifica (ISO): decide quale versione vince tra dispositivi. */
  updatedAt?: string
}

const PREFIX = 'weekly-plan:dayplan:'

export function storageKey(profile: ProfileId, date: string) {
  return `${PREFIX}${profile}:${date}`
}

/** "profilo|data", la chiave usata dalla coda di sincronizzazione. */
export function planId(profile: ProfileId, date: string) {
  return `${profile}|${date}`
}

export function parsePlanId(id: string): { profile: ProfileId; date: string } {
  const [profile, date] = id.split('|')
  return { profile: profile as ProfileId, date }
}

export function readPlan(profile: ProfileId, date: string): StoredDayPlan | null {
  try {
    const raw = localStorage.getItem(storageKey(profile, date))
    return raw ? (JSON.parse(raw) as StoredDayPlan) : null
  } catch {
    return null
  }
}

/** Scrive senza avviare la sincronizzazione (usato per applicare le modifiche arrivate dal database). */
export function writePlanRaw(profile: ProfileId, date: string, plan: StoredDayPlan) {
  try {
    localStorage.setItem(storageKey(profile, date), JSON.stringify(plan))
  } catch {
    // Storage pieno o bloccato: l'app continua con lo stato in memoria.
  }
}

/** Il contenuto di un giorno senza l'ora di modifica: serve a capire se è cambiato davvero. */
export function contentOf(plan: StoredDayPlan): string {
  return JSON.stringify({ week: plan.week, dayType: plan.dayType, state: plan.state, note: plan.note ?? '' })
}

/** Tutti i giorni salvati su questo dispositivo, come "profilo|data". */
export function localPlanIds(): string[] {
  const ids: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PREFIX)) continue
      const [profile, date] = key.slice(PREFIX.length).split(':')
      if (profile && date) ids.push(planId(profile as ProfileId, date))
    }
  } catch {
    // Storage non disponibile.
  }
  return ids
}

type Listener = (profile: ProfileId, date: string) => void
const listeners = new Set<Listener>()

/** Notifica quando un giorno cambia per una modifica arrivata da un altro dispositivo. */
export function onRemotePlanChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitRemotePlanChange(profile: ProfileId, date: string) {
  for (const l of listeners) l(profile, date)
}
