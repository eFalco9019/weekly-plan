import type { MealTemplate, MealType } from '../types'

const MEALS: MealType[] = ['colazione', 'pranzo', 'cena', 'spuntino']

export interface MealMacroShare {
  meal: MealType
  targetG: number
}

/**
 * Suddivide un target fisso giornaliero (proteine o grassi, costante per
 * tutte le settimane) tra i 4 pasti.
 *
 * Il piano specifica esplicitamente quanta parte spetta al pranzo (vedi
 * targetProteinG/targetFatG in MealTemplate). Per colazione/cena/spuntino
 * il piano NON indica una densità proteica/lipidica per alimento, quindi
 * qui il resto del totale giornaliero viene diviso in parti uguali tra
 * gli altri tre pasti — è una stima di Claude, non una misura delle
 * scelte alimentari del giorno, e andrebbe confermata con Ezio se la
 * suddivisione reale non è uniforme.
 */
export function splitFixedMacroByMeal(
  dailyTotal: number,
  templates: MealTemplate[],
  key: 'targetProteinG' | 'targetFatG',
): MealMacroShare[] {
  const explicit = new Map<MealType, number>()
  let explicitSum = 0
  for (const t of templates) {
    const v = t[key]
    if (v !== undefined) {
      explicit.set(t.meal, v)
      explicitSum += v
    }
  }
  const remainingMeals = MEALS.filter((m) => !explicit.has(m))
  const remaining = Math.max(0, dailyTotal - explicitSum)
  const share = remainingMeals.length > 0 ? remaining / remainingMeals.length : 0

  return MEALS.map((meal) => ({
    meal,
    targetG: explicit.get(meal) ?? Math.round(share * 10) / 10,
  }))
}
