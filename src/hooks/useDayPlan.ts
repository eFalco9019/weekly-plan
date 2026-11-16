import { useEffect, useMemo, useState } from 'react'
import type { DayType, FoodEquivalent, MealTemplate, MealType, ProfileId, Recipe } from '../types'
import { mealEquivalentsForWeek, templatesForWeek } from '../data/weekRegistry'
import { recipes } from '../data/recipes'
import { ingredientInfo } from '../data/ingredients'
import { rebalanceDay } from '../lib/macroEngine'
import { rotationIndex, rotationIndexAt, dayNumber, foodAlternatives } from '../lib/rotation'
import { scaleRecipe, recipesForMeal } from '../lib/recipeEngine'

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
  /** Solo per le ricette: CHO che contano sul target portati dagli
   * ingredienti non scalabili (legumi, castagne…), sommati a quelli
   * dell'ingrediente scalabile. */
  choFissiG?: number
  /** Ricetta proposta dalla rotazione automatica (non scelta a mano):
   * "Varia il menu" può sostituirla. */
  recipeAuto?: boolean
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
  const state = defaultDayState(week, dayType, date)
  saveDayPlan(profile, date, { week, dayType, state, note: saved?.note })
}

/** Scrive/aggiorna la nota del giorno (es. tipo di allenamento) senza
 * toccare dayType/settimana/scelte — usato dalla vista settimanale per
 * annotare rapidamente senza aprire il drill-down. */
export function setNoteForDate(profile: ProfileId, date: string, note: string) {
  const saved = loadDayPlan(profile, date)
  const week = saved?.week ?? 1
  const dayType = saved?.dayType ?? 'ON'
  const state = saved?.state ?? defaultDayState(week, dayType, date)
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
    actual += (scelta.grammi * density) / 100 + (scelta.choFissiG ?? 0)
    target += dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG
  }
  return { actual, target }
}

/** Come calcDayChoTotals, ma pasto per pasto — usato dal grafico "CHO
 * per pasto" nel drill-down giornaliero. */
export function calcMealChoBreakdown(
  week: number,
  dayType: DayType,
  state: DayState,
  templates: MealTemplate[],
): { meal: MealType; actual: number; target: number }[] {
  const meals: MealType[] = ['colazione', 'pranzo', 'cena', 'spuntino']
  return meals.map((meal) => {
    const template = templates.find((t) => t.meal === meal)
    const scelta = state[meal]?.scelte.carboidrati
    const density = scelta ? carboDensity(week, meal, scelta) : 0
    const actual = density > 0 && scelta ? (scelta.grammi * density) / 100 + (scelta.choFissiG ?? 0) : 0
    const target = template ? (dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG) : 0
    return { meal, actual, target }
  })
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

/** Densità di CHO dell'ingrediente scalabile di una ricetta per un pasto:
 * se è un alimento delle tabelle del piano (es. "Riso basmati" a cena) usa
 * la stessa densità del piano, così la ricetta rispetta le sue grammature;
 * altrimenti il valore della ricetta o dell'archivio ingredienti. */
export function recipeDensity(week: number, meal: MealType, recipe: Recipe): number {
  const sc = recipe.ingredienti.find((i) => i.scalabile)
  if (!sc) return 0
  const plan = mealEquivalents(week, meal).carboidrati?.find((e) => e.alimento.toLowerCase() === sc.nome.toLowerCase())
  return plan?.choPer100g ?? sc.choPer100g ?? ingredientInfo(sc.nome)?.cho ?? 0
}

/** La scelta "carboidrati" che rappresenta una ricetta assegnata a un pasto. */
export function recipeChoice(
  week: number,
  meal: MealType,
  dayType: DayType,
  recipe: Recipe,
  auto = false,
): MealChoice | null {
  const template = templatesForWeek(week).find((t) => t.meal === meal)
  if (!template) return null
  const density = recipeDensity(week, meal, recipe)
  if (density <= 0) return null
  const targetChoG = dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG
  const scaled = scaleRecipe(recipe, { targetChoG, density })
  if (!scaled.scalabile) return null
  return {
    alimento: scaled.scalabile.nome,
    grammi: scaled.scalabile.grammi,
    choPer100gOverride: density,
    choFissiG: scaled.choFissiG,
    recipeId: recipe.id,
    ...(auto ? { recipeAuto: true } : {}),
  }
}

/** Quanti giorni su 7 la rotazione propone una ricetta per pasto. */
const recipeDaysPerWeek: Partial<Record<MealType, number>> = { colazione: 2, pranzo: 3, cena: 2 }

/** Ingredienti di una ricetta che non devono ripetersi negli altri pasti
 * dello stesso giorno (fonti di carboidrati, proteine, verdure). */
function recipeKeyFoods(recipe: Recipe): string[] {
  return recipe.ingredienti
    .filter((i) => {
      const cat = ingredientInfo(i.nome)?.cat
      return cat === 'carboidrati' || cat === 'proteine' || cat === 'verdura'
    })
    .flatMap((i) => foodAlternatives(i.nome))
}

/** Ricette candidate per lo slot-ricetta di un pasto in un giorno, in
 * ordine di preferenza (vuoto se quel giorno il pasto è "da tabella").
 * In ogni blocco di 7 giorni la ricetta compare `recipeDaysPerWeek`
 * volte, e le ricette si alternano in ordine prima di ripetersi. */
function recipeCandidates(meal: MealType, day: number, seed: number): Recipe[] {
  const k = recipeDaysPerWeek[meal]
  const pool = recipesForMeal(recipes, meal)
  if (!k || pool.length === 0) return []
  const isSlot = (d: number) => rotationIndexAt(d, `${meal}:slot`, 7, seed) < k
  if (!isSlot(day)) return []
  // Blocchi lunedì-domenica (dayNumber 0 = giovedì 1/1/1970).
  const blockStart = day - (((day + 3) % 7) + 7) % 7
  let rank = 0
  for (let d = blockStart; d < day; d++) if (isSlot(d)) rank++
  const start = ((blockStart + 3) / 7) * k + rank + rotationIndexAt(0, `${meal}:recipe`, pool.length, seed)
  return pool.map((_, i) => pool[(((start + i) % pool.length) + pool.length) % pool.length])
}

/** Alimenti "principali" (carbo, proteine, verdure) che la rotazione mette
 * in un pasto in un giorno, senza considerare gli aggiustamenti: usati per
 * non ripetere lo stesso alimento nello stesso pasto di giorni vicini. */
function neighbourFoods(week: number, meal: MealType, day: number, seed: number): string[] {
  const recipe = recipeCandidates(meal, day, seed)[0]
  if (recipe) return recipeKeyFoods(recipe)
  const out: string[] = []
  for (const [categoria, items] of Object.entries(mealEquivalents(week, meal))) {
    if (!noRepeatInDay.has(categoria) || items.length === 0) continue
    out.push(...foodAlternatives(items[rotationIndexAt(day, `${meal}:${categoria}`, items.length, seed)].alimento))
  }
  return out
}

/** Ricetta proposta dalla rotazione per un pasto in una data, o null se
 * quel giorno il pasto resta "da tabella" (o nessuna ricetta è compatibile
 * con il resto della giornata e con i giorni vicini). */
function rotationRecipe(
  week: number,
  meal: MealType,
  dayType: DayType,
  date: string,
  seed: number,
  usedToday: Set<string>,
  avoid: Set<string>,
): MealChoice | null {
  const day = dayNumber(date)
  const candidates = recipeCandidates(meal, day, seed)
  // Ricette già previste negli altri giorni della stessa settimana per
  // questo pasto: se la prima scelta va scartata, non si "ruba" quella di
  // un altro giorno (eviterebbe la stessa ricetta due volte in settimana).
  const weekStart = day - (((day + 3) % 7) + 7) % 7
  const takenThisWeek = new Set<string>()
  for (let d = weekStart; d < weekStart + 7; d++) {
    if (d === day) continue
    const first = recipeCandidates(meal, d, seed)[0]
    if (first) takenThisWeek.add(first.id)
  }
  for (const [i, recipe] of candidates.entries()) {
    if (i > 0 && takenThisWeek.has(recipe.id)) continue
    const keys = recipeKeyFoods(recipe)
    if (keys.some((key) => usedToday.has(key) || avoid.has(key))) continue
    const choice = recipeChoice(week, meal, dayType, recipe, true)
    if (!choice) continue
    for (const key of keys) usedToday.add(key)
    return choice
  }
  return null
}

/** Categorie in cui lo stesso alimento non deve ripetersi tra i pasti
 * della stessa giornata (es. riso, pollo o la stessa verdura a pranzo e a cena). */
const noRepeatInDay = new Set(['carboidrati', 'proteine', 'verdura'])

function defaultMealState(
  week: number,
  meal: MealType,
  dayType: DayType,
  date: string | undefined,
  seed: number,
  usedToday: Set<string>,
  /** Alimenti da evitare in questo pasto perché già nello stesso pasto del
   * giorno prima o dopo (es. il merluzzo della ricetta di ieri a cena). */
  avoid: Set<string> = new Set(),
): MealState {
  const groups = mealEquivalents(week, meal)
  const scelte: MealState['scelte'] = {}
  for (const [categoria, items] of Object.entries(groups)) {
    if (items.length === 0) continue
    let idx = date ? rotationIndex(date, `${meal}:${categoria}`, items.length, seed) : 0
    if (date && noRepeatInDay.has(categoria)) {
      const blocked = (alimento: string) =>
        foodAlternatives(alimento).some((alt) => usedToday.has(alt) || avoid.has(alt))
      if (blocked(items[idx].alimento)) {
        // Prima alternativa libera; se non ce n'è, si tiene la scelta naturale.
        for (let k = 1; k < items.length; k++) {
          const cand = (idx + k) % items.length
          if (!blocked(items[cand].alimento)) {
            idx = cand
            break
          }
        }
      }
      for (const alt of foodAlternatives(items[idx].alimento)) usedToday.add(alt)
    }
    const item = items[idx]
    scelte[categoria] = {
      alimento: item.alimento,
      grammi: dayType === 'ON' ? item.grammiOn : item.grammiOff,
    }
  }
  return { scelte }
}

/**
 * Scelte di default di una giornata. Con `date`, ogni categoria ruota tra
 * gli alimenti equivalenti in base alla data (varietà tra i giorni, vedi
 * src/lib/rotation.ts); senza `date`, prende il primo alimento di ogni
 * tabella. `seed` sposta la rotazione su un'altra combinazione.
 */
export function defaultDayState(week: number, dayType: DayType, date?: string, seed = 0): DayState {
  const usedToday = new Set<string>()
  // Ordine della giornata: le scelte di colazione/pranzo condizionano la cena.
  const build = (meal: MealType): MealState => {
    const avoid = new Set<string>()
    if (date) {
      const day = dayNumber(date)
      for (const d of [day - 1, day + 1]) for (const f of neighbourFoods(week, meal, d, seed)) avoid.add(f)
    }
    const recipe = date ? rotationRecipe(week, meal, dayType, date, seed, usedToday, avoid) : null
    if (!recipe) return defaultMealState(week, meal, dayType, date, seed, usedToday, avoid)
    // Pasto-ricetta: le scelte da tabella restano pronte se si toglie la
    // ricetta, ma non "occupano" alimenti per gli altri pasti del giorno.
    const fallback = defaultMealState(week, meal, dayType, date, seed, new Set(usedToday))
    return { scelte: { ...fallback.scelte, carboidrati: recipe } }
  }
  const colazione = build('colazione')
  const pranzo = build('pranzo')
  const cena = build('cena')
  const spuntino = build('spuntino')
  return { colazione, pranzo, cena, spuntino }
}

/**
 * Rigenera il menu (nuove combinazioni) di una lista di date, mantenendo
 * per ciascun giorno ON/OFF, settimana nutrizionale, nota e le ricette
 * scelte a mano (quelle proposte dalla rotazione vengono rimescolate).
 * Usato dal pulsante della vista settimanale.
 */
export function regenerateMenu(profile: ProfileId, dates: string[], seed: number) {
  for (const date of dates) {
    const saved = loadDayPlan(profile, date)
    const week = saved?.week ?? 1
    const dayType = saved?.dayType ?? 'ON'
    const state = defaultDayState(week, dayType, date, seed)
    if (saved) {
      for (const meal of Object.keys(state) as MealType[]) {
        const c = saved.state[meal]?.scelte.carboidrati
        if (c?.recipeId && !c.recipeAuto) state[meal] = saved.state[meal]
      }
    }
    saveDayPlan(profile, date, { week, dayType, state, note: saved?.note })
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
      setState(defaultDayState(1, 'ON', date))
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
    setState(defaultDayState(week, newType, date))
  }

  function setWeek(newWeek: number) {
    setWeekState(newWeek)
    setState(defaultDayState(newWeek, dayType, date))
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
        choFissiG: scelta.choFissiG,
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
    const choice = recipeChoice(week, meal, dayType, recipe)
    if (!choice) return
    setState((prev) => ({
      ...prev,
      [meal]: { scelte: { ...prev[meal].scelte, carboidrati: choice } },
    }))
  }

  /** Rimuove la ricetta: il pasto torna alla scelta da tabella che la
   * rotazione propone per quella data. */
  function clearRecipe(meal: MealType) {
    const fallback = defaultMealState(week, meal, dayType, date, 0, new Set())
    setState((prev) => ({
      ...prev,
      [meal]: { scelte: { ...prev[meal].scelte, ...fallback.scelte } },
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
