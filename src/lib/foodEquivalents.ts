import type { FoodEquivalent, FoodCategory, MealTemplate, MealType } from '../types'

/**
 * Le tabelle del piano danno, per ogni alimento, la grammatura ON e OFF
 * che fa raggiungere il target di CHO di quel pasto — ma non la densità
 * di CHO per 100g dell'alimento. La deriviamo dal target del pasto
 * stesso (così il motore di compensazione resta coerente con le
 * grammature scritte nel piano, invece di usare valori nutrizionali
 * "da tabella" che potrebbero non coincidere con quelli usati per
 * costruire il piano originale).
 */
export interface RawFood {
  alimento: string
  categoria: FoodCategory
  grammiOn: number
  grammiOff: number
  note?: string
}

export function buildFoodEquivalents(
  meal: MealType,
  template: MealTemplate,
  rawFoods: RawFood[],
): FoodEquivalent[] {
  return rawFoods.map((f) => {
    if (f.categoria !== 'carboidrati') {
      return { meal, ...f }
    }
    // Densità derivata dal target ON (più preciso perché i target OFF
    // sono spesso scritti come "circa"); verificabile contro OFF.
    const choPer100g = template.targetChoOnG > 0 && f.grammiOn > 0
      ? Math.round(((template.targetChoOnG * 100) / f.grammiOn) * 10) / 10
      : 0
    return { meal, ...f, choPer100g }
  })
}
