import type { Recipe, RecipeIngredient } from '../types'

export interface ScaledIngredient extends RecipeIngredient {
  grammi: number
}

/**
 * Adatta una ricetta della libreria a un pasto del piano:
 * - l'ingrediente "scalabile" (tipicamente la pasta) viene ricalcolato
 *   per centrare esattamente il target di CHO del pasto in quella
 *   giornata (come le grammature delle tabelle di equivalenza)
 * - gli altri ingredienti scalano in proporzione alle porzioni richieste
 *   rispetto alle porzioni base della ricetta (es. x2 per 2 persone)
 */
export function scaleRecipeToMeal(
  recipe: Recipe,
  opts: { targetChoG: number; porzioni: number },
): ScaledIngredient[] {
  const servingsRatio = opts.porzioni / recipe.porzioniBase

  return recipe.ingredienti.map((ing) => {
    if (ing.scalabile && ing.choPer100g) {
      // Il target di CHO è per persona nel piano: moltiplichiamo per le
      // porzioni per ottenere la quantità totale dell'ingrediente scalabile.
      const grammiPerPorzione = (opts.targetChoG * 100) / ing.choPer100g
      return { ...ing, grammi: Math.round(grammiPerPorzione * opts.porzioni) }
    }
    return { ...ing, grammi: Math.round(ing.grammiBase * servingsRatio) }
  })
}

/** Elenco ricette adatte a un dato pasto (usato per i filtri in UI). */
export function recipesForMeal(recipes: Recipe[], meal: Recipe['pastoConsigliato']) {
  return recipes.filter((r) => r.pastoConsigliato === meal)
}
