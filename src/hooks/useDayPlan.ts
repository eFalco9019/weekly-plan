import { useEffect, useMemo, useState } from 'react'
import type { DayType, FoodEquivalent, MealType, ProfileId } from '../types'
import { week1Templates, week1Colazione, week1Pranzo, week1Cena, week1Spuntino } from '../data/week1'
import { rebalanceDay } from '../lib/macroEngine'

/**
 * Stato di un pasto per la giornata selezionata: alimento scelto per
 * ogni categoria + grammatura. Per ora i dati sono disponibili solo
 * per la Settimana 1 (vedi src/data/week1.ts); le altre settimane
 * useranno la stessa struttura quando arriveranno.
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

export function mealEquivalents(meal: MealType): Record<string, FoodEquivalent[]> {
  switch (meal) {
    case 'colazione':
      return week1Colazione
    case 'pranzo':
      return week1Pranzo
    case 'cena':
      return week1Cena
    case 'spuntino':
      return week1Spuntino as unknown as Record<string, FoodEquivalent[]>
  }
}

function defaultMealState(meal: MealType, dayType: DayType): MealState {
  const groups = mealEquivalents(meal)
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

function defaultDayState(dayType: DayType): DayState {
  return {
    colazione: defaultMealState('colazione', dayType),
    pranzo: defaultMealState('pranzo', dayType),
    cena: defaultMealState('cena', dayType),
    spuntino: defaultMealState('spuntino', dayType),
  }
}

export function useDayPlan(profile: ProfileId, date: string) {
  const [week, setWeek] = useState<number>(1)
  const [dayType, setDayType] = useState<DayType>('ON')
  const [state, setState] = useState<DayState>(() => defaultDayState('ON'))

  // Carica da localStorage quando cambiano profilo/data.
  useEffect(() => {
    const raw = localStorage.getItem(storageKey(profile, date))
    if (raw) {
      const parsed = JSON.parse(raw) as { week: number; dayType: DayType; state: DayState }
      setWeek(parsed.week)
      setDayType(parsed.dayType)
      setState(parsed.state)
    } else {
      setWeek(1)
      setDayType('ON')
      setState(defaultDayState('ON'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, date])

  // Salva a ogni modifica.
  useEffect(() => {
    localStorage.setItem(storageKey(profile, date), JSON.stringify({ week, dayType, state }))
  }, [profile, date, week, dayType, state])

  const templates = useMemo(() => week1Templates.filter((t) => t.week === week), [week])

  function setDayTypeAndReset(newType: DayType) {
    setDayType(newType)
    setState(defaultDayState(newType))
  }

  function setAlimento(meal: MealType, categoria: string, alimento: string) {
    const items = mealEquivalents(meal)[categoria]
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
      const equivalents = mealEquivalents(m).carboidrati
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
