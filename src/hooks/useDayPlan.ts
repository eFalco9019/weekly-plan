import { useEffect, useMemo, useState } from 'react'
import type { DayType, MealType, Recipe } from '../types'
import { equivalents, mealTarget, mealTargets, type Piano } from '../data/piano'
import { recipes } from '../data/recipes'
import { ingredientInfo } from '../data/ingredients'
import { rebalanceDay, mealCho, type EngineMeal } from '../lib/macroEngine'
import { rotationIndex, rotationIndexAt, dayNumber, foodAlternatives } from '../lib/rotation'
import { scaleRecipe, recipesForMeal } from '../lib/recipeEngine'
import { readPlan, writePlanRaw, contentOf, onRemotePlanChange, type StoredDayPlan } from '../lib/planStore'
import { queueUpload } from '../lib/sync'

/**
 * Scelta di una categoria di un pasto: alimento e grammi. Se il pasto è una
 * ricetta, la scelta "carboidrati" porta `recipeId` e la densità del suo
 * ingrediente regolabile.
 */
export interface MealChoice {
  alimento: string
  grammi: number
  bloccato?: boolean
  choPer100gOverride?: number
  recipeId?: string
  /** Solo ricette: carboidrati degli ingredienti non regolabili (legumi, castagne…). */
  choFissiG?: number
  /** Ricetta proposta dalla rotazione: "Varia il menu" può sostituirla. */
  recipeAuto?: boolean
}

export interface MealState {
  scelte: Record<string, MealChoice>
}

export type DayState = Record<MealType, MealState>

export type { StoredDayPlan } from '../lib/planStore'

const meals: MealType[] = ['colazione', 'pranzo', 'spuntino', 'cena']

/** Salva un giorno e, se il contenuto è cambiato davvero, lo mette in coda per il database. */
export function saveDayPlan(date: string, plan: StoredDayPlan) {
  const prev = readPlan(date)
  if (prev && contentOf(prev) === contentOf(plan)) return
  writePlanRaw(date, { ...plan, note: plan.note ?? '', updatedAt: new Date().toISOString() })
  queueUpload(date)
}

/** Il giorno salvato, oppure quello proposto dalla rotazione se non è mai stato aperto. */
export function dayOrDefault(piano: Piano, date: string): Required<Omit<StoredDayPlan, 'updatedAt'>> {
  const saved = readPlan(date)
  const week = Math.min(saved?.week ?? 1, piano.settimane)
  const dayType = saved?.dayType ?? 'ON'
  return { week, dayType, state: saved?.state ?? defaultDayState(piano, week, dayType, date), note: saved?.note ?? '' }
}

/** Cambia ON/OFF di una data: stessa settimana e nota, pasti ricalcolati per il nuovo tipo. */
export function setDayTypeForDate(piano: Piano, date: string, dayType: DayType) {
  const { week, note } = dayOrDefault(piano, date)
  saveDayPlan(date, { week, dayType, state: defaultDayState(piano, week, dayType, date), note })
}

export function setNoteForDate(piano: Piano, date: string, note: string) {
  saveDayPlan(date, { ...dayOrDefault(piano, date), note })
}

/** Densità di CHO della scelta carboidrati di un pasto (ricetta o tabella). */
export function carboDensity(piano: Piano, week: number, meal: MealType, scelta: MealChoice | undefined): number {
  if (!scelta) return 0
  if (scelta.choPer100gOverride) return scelta.choPer100gOverride
  return equivalents(piano, week, meal).carboidrati?.find((e) => e.alimento === scelta.alimento)?.choPer100g ?? 0
}

/** Carboidrati di ogni pasto, effettivi e target. Lo spuntino conta con la sua quota fissa. */
export function calcMealChoBreakdown(piano: Piano, week: number, dayType: DayType, state: DayState) {
  return meals.map((meal) => {
    const t = mealTarget(piano, week, meal)
    if (t.choFissoG) return { meal, actual: state[meal] ? t.choFissoG : 0, target: t.choFissoG }
    const scelta = state[meal]?.scelte.carboidrati
    const density = carboDensity(piano, week, meal, scelta)
    const actual = scelta && density > 0 ? mealCho({ grammi: scelta.grammi, density, fissi: scelta.choFissiG }) : 0
    return { meal, actual, target: dayType === 'ON' ? t.targetChoOnG : t.targetChoOffG }
  })
}

export function calcDayChoTotals(piano: Piano, week: number, dayType: DayType, state: DayState) {
  return calcMealChoBreakdown(piano, week, dayType, state).reduce(
    (tot, m) => ({ actual: tot.actual + m.actual, target: tot.target + m.target }),
    { actual: 0, target: 0 },
  )
}

/** Densità dell'ingrediente regolabile di una ricetta: quella del piano se è un alimento delle tabelle. */
function recipeDensity(piano: Piano, week: number, meal: MealType, recipe: Recipe): number {
  const sc = recipe.ingredienti.find((i) => i.scalabile)
  if (!sc) return 0
  const plan = equivalents(piano, week, meal).carboidrati?.find((e) => e.alimento.toLowerCase() === sc.nome.toLowerCase())
  return plan?.choPer100g ?? sc.choPer100g ?? ingredientInfo(sc.nome)?.cho ?? 0
}

/** La scelta "carboidrati" che rappresenta una ricetta assegnata a un pasto. */
function recipeChoice(piano: Piano, week: number, meal: MealType, dayType: DayType, recipe: Recipe, auto = false): MealChoice | null {
  const t = mealTarget(piano, week, meal)
  const density = recipeDensity(piano, week, meal, recipe)
  if (density <= 0) return null
  const scaled = scaleRecipe(recipe, { targetChoG: dayType === 'ON' ? t.targetChoOnG : t.targetChoOffG, density })
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

// ---------------------------------------------------------------------
// Rotazione: varietà del menu tra i giorni
// ---------------------------------------------------------------------

/** Quanti giorni su 7 la rotazione propone una ricetta per pasto. */
const recipeDaysPerWeek: Partial<Record<MealType, number>> = { colazione: 2, pranzo: 3, cena: 2 }

/** Categorie in cui lo stesso alimento non si ripete tra i pasti dello stesso giorno. */
const noRepeatInDay = new Set(['carboidrati', 'proteine', 'verdura'])

/** Inizio (lunedì) del blocco di 7 giorni che contiene `day` (dayNumber 0 = giovedì 1/1/1970). */
const weekStartOf = (day: number) => day - ((((day + 3) % 7) + 7) % 7)

/** Ingredienti di una ricetta che non devono ripetersi negli altri pasti del giorno. */
function recipeKeyFoods(recipe: Recipe): string[] {
  return recipe.ingredienti
    .filter((i) => noRepeatInDay.has(ingredientInfo(i.nome)?.cat ?? ''))
    .flatMap((i) => foodAlternatives(i.nome))
}

/**
 * Ricette candidate per un pasto in un giorno, in ordine di preferenza (vuoto
 * se quel giorno il pasto è da tabella). In ogni settimana la ricetta compare
 * `recipeDaysPerWeek` volte e le ricette si alternano prima di ripetersi.
 */
function recipeCandidates(meal: MealType, day: number, seed: number): Recipe[] {
  const k = recipeDaysPerWeek[meal]
  const pool = recipesForMeal(recipes, meal)
  if (!k || pool.length === 0) return []
  const isSlot = (d: number) => rotationIndexAt(d, `${meal}:slot`, 7, seed) < k
  if (!isSlot(day)) return []
  const blockStart = weekStartOf(day)
  let rank = 0
  for (let d = blockStart; d < day; d++) if (isSlot(d)) rank++
  const start = ((blockStart + 3) / 7) * k + rank + rotationIndexAt(0, `${meal}:recipe`, pool.length, seed)
  return pool.map((_, i) => pool[(((start + i) % pool.length) + pool.length) % pool.length])
}

/** Alimenti principali che la rotazione mette in un pasto in un giorno (per non ripeterli nei giorni vicini). */
function neighbourFoods(piano: Piano, week: number, meal: MealType, day: number, seed: number): string[] {
  const recipe = recipeCandidates(meal, day, seed)[0]
  if (recipe) return recipeKeyFoods(recipe)
  return Object.entries(equivalents(piano, week, meal))
    .filter(([categoria, items]) => noRepeatInDay.has(categoria) && items.length > 0)
    .flatMap(([categoria, items]) => foodAlternatives(items[rotationIndexAt(day, `${meal}:${categoria}`, items.length, seed)].alimento))
}

function rotationRecipe(
  piano: Piano,
  week: number,
  meal: MealType,
  dayType: DayType,
  date: string,
  seed: number,
  usedToday: Set<string>,
  avoid: Set<string>,
): MealChoice | null {
  const day = dayNumber(date)
  // Le ricette già previste negli altri giorni della settimana non si "rubano".
  const weekStart = weekStartOf(day)
  const taken = new Set<string>()
  for (let d = weekStart; d < weekStart + 7; d++) {
    const first = d === day ? undefined : recipeCandidates(meal, d, seed)[0]
    if (first) taken.add(first.id)
  }
  for (const [i, recipe] of recipeCandidates(meal, day, seed).entries()) {
    if (i > 0 && taken.has(recipe.id)) continue
    const keys = recipeKeyFoods(recipe)
    if (keys.some((key) => usedToday.has(key) || avoid.has(key))) continue
    const choice = recipeChoice(piano, week, meal, dayType, recipe, true)
    if (!choice) continue
    for (const key of keys) usedToday.add(key)
    return choice
  }
  return null
}

function tableMealState(
  piano: Piano,
  week: number,
  meal: MealType,
  dayType: DayType,
  date: string | undefined,
  seed: number,
  usedToday: Set<string>,
  avoid: Set<string> = new Set(),
): MealState {
  const scelte: MealState['scelte'] = {}
  for (const [categoria, items] of Object.entries(equivalents(piano, week, meal))) {
    if (items.length === 0) continue
    let idx = date ? rotationIndex(date, `${meal}:${categoria}`, items.length, seed) : 0
    if (date && noRepeatInDay.has(categoria)) {
      const blocked = (a: string) => foodAlternatives(a).some((alt) => usedToday.has(alt) || avoid.has(alt))
      // Prima alternativa libera; se non ce n'è, resta la scelta naturale.
      for (let k = 0; k < items.length; k++) {
        const cand = (idx + k) % items.length
        if (!blocked(items[cand].alimento)) {
          idx = cand
          break
        }
      }
      for (const alt of foodAlternatives(items[idx].alimento)) usedToday.add(alt)
    }
    const item = items[idx]
    scelte[categoria] = { alimento: item.alimento, grammi: dayType === 'ON' ? item.grammiOn : item.grammiOff }
  }
  return { scelte }
}

/**
 * Pasti proposti per un giorno. Con `date` gli alimenti ruotano in base alla
 * data (varietà, src/lib/rotation.ts) e alcuni pasti diventano ricette;
 * `seed` sposta la rotazione su un'altra combinazione.
 */
export function defaultDayState(piano: Piano, week: number, dayType: DayType, date?: string, seed = 0): DayState {
  const usedToday = new Set<string>()
  const build = (meal: MealType): MealState => {
    const avoid = new Set<string>()
    if (date) {
      const day = dayNumber(date)
      for (const d of [day - 1, day + 1]) for (const f of neighbourFoods(piano, week, meal, d, seed)) avoid.add(f)
    }
    const recipe = date ? rotationRecipe(piano, week, meal, dayType, date, seed, usedToday, avoid) : null
    if (!recipe) return tableMealState(piano, week, meal, dayType, date, seed, usedToday, avoid)
    // Le scelte da tabella restano pronte se si toglie la ricetta, senza occupare alimenti.
    const fallback = tableMealState(piano, week, meal, dayType, date, seed, new Set(usedToday))
    return { scelte: { ...fallback.scelte, carboidrati: recipe } }
  }
  // Ordine della giornata: colazione e pranzo condizionano la cena.
  const colazione = build('colazione')
  const pranzo = build('pranzo')
  const cena = build('cena')
  return { colazione, pranzo, cena, spuntino: build('spuntino') }
}

/** Nuove combinazioni per le date indicate, tenendo ON/OFF, settimana, nota e ricette scelte a mano. */
export function regenerateMenu(piano: Piano, dates: string[], seed: number) {
  for (const date of dates) {
    const saved = readPlan(date)
    const { week, dayType, note } = dayOrDefault(piano, date)
    const state = defaultDayState(piano, week, dayType, date, seed)
    for (const meal of meals) {
      const c = saved?.state[meal]?.scelte.carboidrati
      if (c?.recipeId && !c.recipeAuto) state[meal] = saved!.state[meal]
    }
    saveDayPlan(date, { week, dayType, state, note })
  }
}

// ---------------------------------------------------------------------
// Hook del giorno
// ---------------------------------------------------------------------

export function useDayPlan(piano: Piano, date: string) {
  const [day, setDay] = useState(() => dayOrDefault(piano, date))
  // Per quale data è stato caricato lo stato: finché non coincide non si salva,
  // altrimenti al cambio di giorno lo stato precedente finirebbe sul nuovo.
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    setDay(dayOrDefault(piano, date))
    setLoadedFor(date)
  }, [piano, date])

  useEffect(() => onRemotePlanChange((d) => d === date && setDay(dayOrDefault(piano, date))), [piano, date])

  useEffect(() => {
    if (loadedFor === date) saveDayPlan(date, day)
  }, [loadedFor, date, day])

  const { week, dayType, state, note } = day
  const templates = useMemo(() => mealTargets(piano, week), [piano, week])
  const update = (patch: Partial<typeof day>) => setDay((prev) => ({ ...prev, ...patch }))
  const setChoice = (meal: MealType, categoria: string, choice: MealChoice) =>
    setDay((prev) => ({
      ...prev,
      state: { ...prev.state, [meal]: { scelte: { ...prev.state[meal].scelte, [categoria]: choice } } },
    }))

  function setCarboGrammi(meal: MealType, grammi: number) {
    const engine: EngineMeal[] = []
    for (const m of ['colazione', 'pranzo', 'cena'] as MealType[]) {
      const scelta = state[m].scelte.carboidrati
      const density = carboDensity(piano, week, m, scelta)
      if (!scelta || density <= 0) continue
      const t = mealTarget(piano, week, m)
      engine.push({
        meal: m,
        target: dayType === 'ON' ? t.targetChoOnG : t.targetChoOffG,
        grammi: m === meal ? grammi : scelta.grammi,
        density,
        fissi: scelta.choFissiG,
        bloccato: scelta.bloccato,
      })
    }
    const updated: Partial<Record<MealType, number>> = { ...rebalanceDay(engine, meal), [meal]: grammi }
    setDay((prev) => {
      const next = { ...prev.state }
      for (const [m, g] of Object.entries(updated) as [MealType, number][]) {
        next[m] = { scelte: { ...next[m].scelte, carboidrati: { ...next[m].scelte.carboidrati, grammi: g } } }
      }
      return { ...prev, state: next }
    })
  }

  return {
    week,
    dayType,
    state,
    note,
    templates,
    setWeek: (w: number) => update({ week: w, state: defaultDayState(piano, w, dayType, date) }),
    setDayType: (t: DayType) => update({ dayType: t, state: defaultDayState(piano, week, t, date) }),
    setNote: (n: string) => update({ note: n }),
    setCarboGrammi,
    setAlimento(meal: MealType, categoria: string, alimento: string) {
      const found = equivalents(piano, week, meal)[categoria]?.find((i) => i.alimento === alimento)
      if (found) setChoice(meal, categoria, { alimento, grammi: dayType === 'ON' ? found.grammiOn : found.grammiOff })
    },
    toggleBlocco(meal: MealType) {
      const c = state[meal].scelte.carboidrati
      if (c) setChoice(meal, 'carboidrati', { ...c, bloccato: !c.bloccato })
    },
    assignRecipe(meal: MealType, recipeId: string) {
      const recipe = recipes.find((r) => r.id === recipeId)
      const choice = recipe && recipeChoice(piano, week, meal, dayType, recipe)
      if (choice) setChoice(meal, 'carboidrati', choice)
    },
    /** Toglie la ricetta: il pasto torna alla scelta da tabella proposta per la data. */
    clearRecipe(meal: MealType) {
      const fallback = tableMealState(piano, week, meal, dayType, date, 0, new Set())
      setDay((prev) => ({
        ...prev,
        state: { ...prev.state, [meal]: { scelte: { ...prev.state[meal].scelte, ...fallback.scelte } } },
      }))
    },
  }
}
