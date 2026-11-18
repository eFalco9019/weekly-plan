import type { DayType } from '../types'
import type { DayState } from '../hooks/useDayPlan'

/**
 * Copia locale dei giorni dell'utente collegato (localStorage). L'app lavora
 * sempre su questa copia, anche offline; src/lib/sync.ts la allinea con il
 * database.
 */
export interface StoredDayPlan {
  week: number
  dayType: DayType
  state: DayState
  /** Nota libera del giorno (es. allenamento fatto). */
  note?: string
  /** Ora dell'ultima modifica (ISO): tra due dispositivi vince la più recente. */
  updatedAt?: string
}

let user = 'locale'
const prefix = () => `weekly-plan:${user}:day:`

/** Imposta l'utente di cui leggere e scrivere i giorni. */
export function setStoreUser(id: string) {
  user = id
}

export function readPlan(date: string): StoredDayPlan | null {
  try {
    const raw = localStorage.getItem(prefix() + date)
    return raw ? (JSON.parse(raw) as StoredDayPlan) : null
  } catch {
    return null
  }
}

/** Scrive senza avviare la sincronizzazione (usato anche per le modifiche arrivate dal database). */
export function writePlanRaw(date: string, plan: StoredDayPlan) {
  try {
    localStorage.setItem(prefix() + date, JSON.stringify(plan))
  } catch {
    // Storage pieno o bloccato: l'app continua con lo stato in memoria.
  }
}

/** Il contenuto di un giorno senza l'ora di modifica: dice se è cambiato davvero. */
export function contentOf(plan: StoredDayPlan): string {
  return JSON.stringify({ week: plan.week, dayType: plan.dayType, state: plan.state, note: plan.note ?? '' })
}

/** Date dei giorni salvati su questo dispositivo per l'utente collegato. */
export function localDates(): string[] {
  const out: string[] = []
  try {
    const p = prefix()
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(p)) out.push(key.slice(p.length))
    }
  } catch {
    // Storage non disponibile.
  }
  return out
}

const listeners = new Set<(date: string) => void>()

/** Notifica i giorni cambiati da un altro dispositivo. */
export function onRemotePlanChange(listener: (date: string) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitRemotePlanChange(date: string) {
  for (const l of listeners) l(date)
}
