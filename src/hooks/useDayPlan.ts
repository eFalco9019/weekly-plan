import { useEffect, useMemo, useState } from 'react'
import type { DayType, MealType, ProfileId } from '../types'
import { mealEquivalentsForWeek, templatesForWeek } from '../data/weekRegistry'
import { rebalanceDay } from '../lib/macroEngine'

/**
 * Stato di un pasto per la giornata selezionata: alimento scelto per
 * ogni categoria + grammatura. I dati del piano (alimenti, target) sono
 * week-aware: vedi src/data/weekRegistry.ts (Settimane 1-4).
 */
export interface MealState {
  // categoria -> { alimento, grammi, bloccato? }
  scelte: Record<string, { alimento: string; grammi: number; bloccato?: boolean }>
}

export type DayState = Record<MealType, MealState>

const STORAGE_PREFIX = 'weekly-plan:dayplan:'

function storageKey(profile: ProfileId, date: string) {
  return `${STORAGE_PREFIX}${profile}:${date}`
}

/** Alimenti disponibili per un pasto, nella settimana indicata. */
export function mealEquivalents(week: number, meal: MealType) {
  return mealEquivalentsForWeek(week, meal)
}

function defaultMealState(week: number, meal: MealType, dayType: DayType): MealState {
  const groups = mealEquivalents(week, meal)
  const scelte: MealState['scelte'] = {}
  for (const [categoria, items] of Object.entries(groups)) {
    const first = items[0]
    if (!first) continue
    scelte[categoria] = {
      alimento: first.alimento,
      grammi: dayType === 'ON' ? first.grammiOn : first.grammiOff,
    }
  }
  return { scelte }
}

function defaultDayState(week: number, dayType: DayType): DayState {
  return {
    colazione: defaultMealState(week, 'colazione', dayType),
    pranzo: defaultMealState(week, 'pranzo', dayType),
    cena: defaultMealState(week, 'cena', dayType),
    spuntino: defaultMealState(week, 'spuntino', dayType),
  }
}

export function useDayPlan(profile: ProfileId, date: string) {
  const [week, setWeekState] = useState<number>(1)
  const [dayType, setDayType] = useState<DayType>('ON')
  const [state, setState] = useState<DayState>(() => defaultDayState(1, 'ON'))

  // Carica da localStorage quando cambiano profilo/data.
  useEffect(() => {
    const raw = localStorage.getItem(storageKey(profile, date))
    if (raw) {
      const parsed = JSON.parse(raw) as { week: number; dayType: DayType; state: DayState }
      setWeekState(parsed.week)
      setDayType(parsed.dayType)
      setState(parsed.state)
    } else {
      setWeekState(1)
      setDayType('ON')
      setState(defaultDayState(1, 'ON'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, date])

  // Salva a ogni modifica.
  useEffect(() => {
    localStorage.setItem(storageKey(profile, date), JSON.stringify({ week, dayType, state }))
  }, [profile, date, week, dayType, state])

  const templates = useMemo(() => templatesForWeek(week), [week])

  function setDayTypeAndReset(newType: DayType) {
    setDayType(newType)
    setState(defaultDayState(week, newType))
  }

  function setWeek(newWeek: number) {
    setWeekState(newWeek)
    setState(defaultDayState(newWeek, dayType))
  }

  function setAlimento(meal: MealType, categoria: string, alimento: string) {
    const items = mealEquivalents(week, meal)[categoria]
    const found = items.find((i) => i.alimento === alimento)
    if (!found) return
    setState((prev) => ({
      ...prev,
      [meal]: {
        scelte: {
          ...prev[meal].scelte,
          [categoria]: {
            alimento,
            grammi: dayType === 'ON' ? found.grammiOn : found.grammiOff,
          },
        },
      },
    }))
  }

  function toggleBlocco(meal: MealType) {
    setState((prev) => ({
      ...prev,
      [meal]: {
        scelte: {
          ...prev[meal].scelte,
          carboidrati: {
            ...prev[meal].scelte.carboidrati,
            bloccato: !prev[meal].scelte.carboidrati?.bloccato,
          },
        },
      },
    }))
  }

  /**
   * Modifica manualmente la grammatura del carboidrato di un pasto e
   * ribilancia gli altri pasti (non bloccati) della giornata per
   * mantenere il totale di CHO giornaliero.
   */
  function setCarboGrammi(meal: MealType, grammi: number) {
    const mealsForEngine: Parameters<typeof rebalanceDay>[0]['meals'] = []

    for (const m of ['colazione', 'pranzo', 'cena'] as MealType[]) {
      const template = templates.find((t) => t.meal === m)
      if (!template) continue
      const scelta = state[m].scelte.carboidrati
      if (!scelta) continue
      const equivalents = mealEquivalents(week, m).carboidrati
      const equivalent = equivalents.find((e) => e.alimento === scelta.alimento)
      if (!equivalent) continue

      const grammiEffettivi = m === meal ? grammi : scelta.grammi

      mealsForEngine.push({
        meal: m,
        template,
        equivalent,
        choice: {
          profile,
          date,
          meal: m,
          categoria: 'carboidrati',
          alimento: scelta.alimento,
          grammi: grammiEffettivi,
          bloccato: scelta.bloccato,
        },
      })
    }

    const results = rebalanceDay({ dayType, meals: mealsForEngine, editedMeal: meal })

    setState((prev) => {
      const next = { ...prev }
      for (const r of results) {
        next[r.meal] = {
          scelte: {
            ...next[r.meal].scelte,
            carboidrati: {
              ...next[r.meal].scelte.carboidrati,
              grammi: r.grammiAggiornati,
            },
          },
        }
      }
      return next
    })
  }

  return {
    week,
    setWeek,
    dayType,
    setDayType: setDayTypeAndReset,
    state,
    templates,
    setAlimento,
    setCarboGrammi,
    toggleBlocco,
  }
}
