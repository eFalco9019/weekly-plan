import type {
  DayMealChoice,
  DayType,
  FoodEquivalent,
  MealTemplate,
  MealType,
} from '../types'

/**
 * Motore di compensazione macro.
 *
 * Idea: ogni pasto ha un target di CHO (per il giorno ON o OFF). La somma
 * dei target dei pasti = CHO totale giornaliero del piano. Se l'utente
 * cambia la grammatura dell'alimento-carboidrato di UN pasto, quel pasto
 * si scosta dal suo target: la differenza (delta) va ridistribuita sugli
 * altri pasti NON bloccati della stessa giornata, in proporzione al peso
 * di ciascuno sul totale "libero" (= totale giornaliero meno il target
 * del pasto appena bloccato/modificato manualmente... per ora, in
 * proporzione ai target originali dei pasti liberi).
 *
 * Il risultato pratico: se mangi più carboidrati a cena, pranzo e
 * colazione si riducono per compensare; se ne mangi meno, si alzano.
 */

export interface MealChoCalc {
  meal: MealType
  targetChoG: number
  actualChoG: number
  alimento: string
  grammi: number
  choPer100g: number
}

/** Calcola il CHO effettivo di un pasto dalla scelta carboidrati corrente. */
export function calcMealCho(
  choice: DayMealChoice,
  equivalent: FoodEquivalent,
): number {
  const choPer100g = equivalent.choPer100g ?? 0
  return (choice.grammi * choPer100g) / 100
}

/** Converte un target di CHO (g) in grammi dell'alimento scelto per quel pasto. */
export function choTargetToGrams(targetChoG: number, choPer100g: number): number {
  if (choPer100g <= 0) return 0
  return Math.round((targetChoG * 100) / choPer100g)
}

export interface RebalanceInput {
  dayType: DayType
  /** Tutti i pasti della giornata con il loro template (target) e la scelta attuale. */
  meals: Array<{
    meal: MealType
    template: MealTemplate
    choice: DayMealChoice
    equivalent: FoodEquivalent // l'alimento-carboidrato scelto per questo pasto
  }>
  /** Il pasto che l'utente ha appena modificato manualmente. */
  editedMeal: MealType
}

export interface RebalanceResultMeal {
  meal: MealType
  grammiAggiornati: number
  choEffettivo: number
}

/**
 * Ricalcola le grammature dei pasti NON bloccati e diversi da quello
 * appena modificato, per compensare lo scostamento dal target
 * giornaliero introdotto dalla modifica manuale.
 */
export function rebalanceDay(input: RebalanceInput): RebalanceResultMeal[] {
  const { dayType, meals, editedMeal } = input

  const targetOf = (t: MealTemplate) =>
    dayType === 'ON' ? t.targetChoOnG : t.targetChoOffG

  const edited = meals.find((m) => m.meal === editedMeal)
  if (!edited) return []

  const editedActualCho = calcMealCho(edited.choice, edited.equivalent)
  const editedTargetCho = targetOf(edited.template)
  const delta = editedActualCho - editedTargetCho // >0 = ha mangiato più CHO del previsto

  // Pasti "liberi": non bloccati e diversi dal pasto appena modificato.
  const freeMeals = meals.filter(
    (m) => m.meal !== editedMeal && !m.choice.bloccato,
  )

  if (freeMeals.length === 0 || delta === 0) {
    return [
      {
        meal: edited.meal,
        grammiAggiornati: edited.choice.grammi,
        choEffettivo: editedActualCho,
      },
    ]
  }

  const totalFreeTarget = freeMeals.reduce((sum, m) => sum + targetOf(m.template), 0)

  const results: RebalanceResultMeal[] = [
    {
      meal: edited.meal,
      grammiAggiornati: edited.choice.grammi,
      choEffettivo: editedActualCho,
    },
  ]

  for (const m of freeMeals) {
    const weight = totalFreeTarget > 0 ? targetOf(m.template) / totalFreeTarget : 1 / freeMeals.length
    const share = delta * weight
    const newTargetForMeal = targetOf(m.template) - share
    const choPer100g = m.equivalent.choPer100g ?? 0
    const newGrams = Math.max(0, choTargetToGrams(newTargetForMeal, choPer100g))
    results.push({
      meal: m.meal,
      grammiAggiornati: newGrams,
      choEffettivo: (newGrams * choPer100g) / 100,
    })
  }

  return results
}

/** Somma dei target di CHO di tutti i pasti del giorno (per sanity-check UI). */
export function dailyChoTarget(templates: MealTemplate[], dayType: DayType): number {
  return templates.reduce(
    (sum, t) => sum + (dayType === 'ON' ? t.targetChoOnG : t.targetChoOffG),
    0,
  )
}
