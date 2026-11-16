import { useEffect, useMemo, useState } from 'react'
import type { DayType, FoodEquivalent, MealTemplate, MealType, ProfileId } from '../types'
import { mealEquivalentsForWeek, templatesForWeek } from '../data/weekRegistry'
import { recipes } from '../data/recipes'
import { rebalanceDay, choTargetToGrams } from '../lib/macroEngine'

/**
 * Stato di un pasto per la giornata selezionata: alimento scelto per
 * ogni categoria + grammatura. I dati del piano (alimenti, target) sono
 * week-aware: vedi src/data/weekRegistry.ts (Settimane 1-4).
 *
 * `choPer100gOverride` + `recipeId` sono valorizzati quando il
 * carboidrato del pasto viene da una ricetta della libreria (vedi
 * assignRecipe) invece che dalla tabella di equivalenza standard.
 */
export interface MealChoice {
  alimento: string
  grammi: number
  bloccato?: boolean
  choPer100gOverride?: number
  recipeId?: string
}

export interface MealState {
  scelte: Record<string, MealChoice>
}

export type DayState = Record<MealType, MealState>

const STORAGE_PREFIX = 'weekly-plan:dayplan:'

export function storageKey(profile: ProfileId, date: string) {
  return `${STORAGE_PREFIX}${profile}:${date}`
}

/** Legge il piano salvato (se esiste) per un profilo/data, senza montare
 * l'hook: usato dalla vista settimanale per mostrare un riepilogo di
 * tutti i 7 giorni senza istanziare un useDayPlan per ciascuno. */
export interface StoredDayPlan {
  week: number
  dayType: DayType
  state: DayState
  /** Nota libera del giorno (es. tipo di allenamento fatto). */
  note?: string
}

export function loadDayPlan(profile: ProfileId, date: string): StoredDayPlan | null {
  const raw = localStorage.getItem(storageKey(profile, date))
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredDayPlan
  } catch {
    return null
  }
}

/** Scrive il piano di un profilo/data in localStorage, senza montare
 * l'hook — usato da WeekView per cambiare ON/OFF direttamente dalla
 * vista settimanale. */
export function saveDayPlan(profile: ProfileId, date: string, plan: StoredDayPlan) {
  localStorage.setItem(storageKey(profile, date), JSON.stringify(plan))
}

/** Cambia ON/OFF per un profilo/data senza aprire il drill-down
 * giornaliero: mantiene la stessa settimana nutrizionale e la nota
 * eventualmente già scritta, e resetta le scelte dei pasti ai valori
 * di default del nuovo tipo di giornata (stessa logica di
 * setDayTypeAndReset dentro useDayPlan). */
export function setDayTypeForDate(profile: ProfileId, date: string, dayType: DayType) {
  const saved = loadDayPlan(profile, date)
  const week = saved?.week ?? 1
  const state = defaultDayState(week, dayType)
  saveDayPlan(profile, date, { week, dayType, state, note: saved?.note })
}

/** Scrive/aggiorna la nota del giorno (es. tipo di allenamento) senza
 * toccare dayType/settimana/scelte — usato dalla vista settimanale per
 * annotare rapidamente senza aprire il drill-down. */
export function setNoteForDate(profile: ProfileId, date: string, note: string) {
  const saved = loadDayPlan(profile, date)
  const week = saved?.week ?? 1
  const dayType = saved?.dayType ?? 'ON'
  const state = saved?.state ?? defaultDayState(week, dayType)
  saveDayPlan(profile, date, { week, dayType, state, note })
}

/** Totale CHO (effettivo vs target) di una giornata, dato lo stato dei
 * pasti. Condiviso tra DayTotals (drill-down giornaliero) e WeekView
 * (riepilogo settimanale). */
export function calcDayChoTotals(
  week: number,
  dayType: DayType,
  state: DayState,
  templates: MealTemplate[],
): { actual: number; target: number } {
  let actual = 0
  let target = 0
  for (const meal of ['colazione', 'pranzo', 'cena', 'spuntino'] as MealType[]) {
    const template = templates.find((t) => t.meal === meal)
    const scelta = state[meal]?.scelte.carboidrati
    if (!template || !scelta) continue
    const density = carboDensity(week, meal, scelta)
    if (density <= 0) continue
    actual += (scelta.grammi * density) / 100
    target += dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG
  }
  return { actual, target }
}

/** Alimenti disponibili per un pasto, nella settimana indicata. */
export function mealEquivalents(week: number, meal: MealType) {
  return mealEquivalentsForWeek(week, meal)
}

/** Densità di CHO per 100g della scelta carboidrati corrente di un pasto:
 * usa l'override (ricetta) se presente, altrimenti cerca nella tabella
 * di equivalenza standard. */
export function carboDensity(week: number, meal: MealType, scelta: MealChoice | undefined): number {
  if (!scelta) return 0
  if (scelta.choPer100gOverride) return scelta.choPer100gOverride
  const found = mealEquivalents(week, meal).carboidrati?.find((e) => e.alimento === scelta.alimento)
  return found?.choPer100g ?? 0
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

export function defaultDayState(week: number, dayType: DayType): DayState {
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
  const [note, setNote] = useState<string>('')

  // Carica da localStorage quando cambiano profilo/data.
  useEffect(() => {
    const raw = localStorage.getItem(storageKey(profile, date))
    if (raw) {
      const parsed = JSON.parse(raw) as StoredDayPlan
      setWeekState(parsed.week)
      setDayType(parsed.dayType)
      setState(parsed.state)
      setNote(parsed.note ?? '')
    } else {
      setWeekState(1)
      setDayType('ON')
      setState(defaultDayState(1, 'ON'))
      setNote('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, date])

  // Salva a ogni modifica.
  useEffect(() => {
    localStorage.setItem(storageKey(profile, date), JSON.stringify({ week, dayType, state, note }))
  }, [profile, date, week, dayType, state, note])

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

  function buildEngineMeals(overrides: Partial<Record<MealType, number>>) {
    const mealsForEngine: Parameters<typeof rebalanceDay>[0]['meals'] = []
    for (const m of ['colazione', 'pranzo', 'cena'] as MealType[]) {
      const template = templates.find((t) => t.meal === m)
      const scelta = state[m].scelte.carboidrati
      if (!template || !scelta) continue
      const density = carboDensity(week, m, scelta)
      if (density <= 0) continue

      const grammiEffettivi = overrides[m] ?? scelta.grammi

      const equivalent: FoodEquivalent = {
        meal: m,
        categoria: 'carboidrati',
        alimento: scelta.alimento,
        grammiOn: 0,
        grammiOff: 0,
        choPer100g: density,
      }

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
    return mealsForEngine
  }

  function applyRebalanceResults(results: ReturnType<typeof rebalanceDay>) {
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

  /**
   * Modifica manualmente la grammatura del carboidrato di un pasto e
   * ribilancia gli altri pasti (non bloccati) della giornata per
   * mantenere il totale di CHO giornaliero.
   */
  function setCarboGrammi(meal: MealType, grammi: number) {
    const mealsForEngine = buildEngineMeals({ [meal]: grammi })
    const results = rebalanceDay({ dayType, meals: mealsForEngine, editedMeal: meal })
    applyRebalanceResults(results)
  }

  /**
   * Assegna una ricetta della libreria al pasto: l'ingrediente
   * "scalabile" della ricetta (es. la pasta) viene impostato alla
   * grammatura che centra il target di CHO del pasto, poi gli altri
   * pasti della giornata si ribilanciano come con una modifica manuale.
   */
  function assignRecipe(meal: MealType, recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    const scalabile = recipe.ingredienti.find((i) => i.scalabile && i.choPer100g)
    if (!scalabile || !scalabile.choPer100g) return

    const template = templates.find((t) => t.meal === meal)
    if (!template) return
    const targetCho = dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG
    const grammi = choTargetToGrams(targetCho, scalabile.choPer100g)

    setState((prev) => ({
      ...prev,
      [meal]: {
        scelte: {
          ...prev[meal].scelte,
          carboidrati: {
            alimento: scalabile.nome,
            grammi,
            choPer100gOverride: scalabile.choPer100g,
            recipeId: recipe.id,
          },
        },
      },
    }))
  }

  /** Rimuove la ricetta assegnata e torna alla scelta da tabella standard. */
  function clearRecipe(meal: MealType) {
    const items = mealEquivalents(week, meal).carboidrati
    const first = items?.[0]
    if (!first) return
    setState((prev) => ({
      ...prev,
      [meal]: {
        scelte: {
          ...prev[meal].scelte,
          carboidrati: {
            alimento: first.alimento,
            grammi: dayType === 'ON' ? first.grammiOn : first.grammiOff,
          },
        },
      },
    }))
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
    assignRecipe,
    clearRecipe,
    note,
    setNote,
  }
}
