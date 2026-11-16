import type { FoodEquivalent, MealTemplate, MealType } from '../types'

/**
 * Ricalcola le grammature ON/OFF di un gruppo di alimenti-carboidrato per
 * una nuova settimana, mantenendo la densità di CHO per 100g già nota
 * (derivata dalla Settimana 1 in src/data/week1.ts). Così i grammi delle
 * Settimane 2-4 restano coerenti con gli alimenti della Settimana 1,
 * semplicemente scalati sul nuovo target di CHO del pasto.
 */
export function scaleCarbGroup(
  meal: MealType,
  template: MealTemplate,
  referenceGroup: FoodEquivalent[],
): FoodEquivalent[] {
  return referenceGroup.map((food) => {
    const density = food.choPer100g ?? 0
    const grammiOn =
      density > 0 ? Math.round((template.targetChoOnG * 100) / density) : food.grammiOn
    const grammiOff =
      density > 0 ? Math.round((template.targetChoOffG * 100) / density) : food.grammiOff
    return { ...food, meal, grammiOn, grammiOff }
  })
}

/**
 * Le categorie proteine/grassi/frutta/verdura non cambiano tra le
 * settimane (proteine e grassi restano costanti per tutte le 4
 * settimane, come indicato da Ezio): si riusa la stessa lista così com'è,
 * solo rietichettata con il pasto corretto (il valore non cambia mai).
 */
export function carryOverGroup(group: FoodEquivalent[]): FoodEquivalent[] {
  return group.map((food) => ({ ...food }))
}
