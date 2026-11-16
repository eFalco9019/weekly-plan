import type { MealType, Recipe } from '../types'
import { ingredientInfo } from '../data/ingredients'

export interface ScaledIngredient {
  nome: string
  grammi: number
  scalabile?: boolean
}

export interface RecipeMacros {
  cho: number
  prot: number
  fat: number
}

export interface ScaledRecipe {
  ingredienti: ScaledIngredient[]
  scalabile?: ScaledIngredient
  /** g di CHO per 100 g dell'ingrediente scalabile. */
  density: number
  /** CHO che contano sul target portati dagli altri ingredienti (legumi, castagne…). */
  choFissiG: number
  macro: RecipeMacros
}

/**
 * Adatta una ricetta della libreria a un pasto del piano (1 porzione):
 * - l'ingrediente "scalabile" (pasta, riso, avena…) viene ricalcolato per
 *   centrare il target di CHO del pasto, tenendo conto dei CHO che gli
 *   altri ingredienti amidacei della ricetta già portano (es. ceci,
 *   piselli, castagne);
 * - gli altri ingredienti restano alle grammature della ricetta.
 *
 * `density` è la densità di CHO dell'ingrediente scalabile: per gli
 * alimenti del piano si usa quella delle tabelle di equivalenza (vedi
 * recipeDensity in useDayPlan), per gli altri l'archivio ingredienti.
 * Con `scalabileGrammi` si ricalcolano i totali su una grammatura già
 * nota (es. dopo la compensazione tra pasti).
 */
export function scaleRecipe(
  recipe: Recipe,
  opts: { targetChoG: number; density: number; scalabileGrammi?: number },
): ScaledRecipe {
  let choFissiG = 0
  for (const ing of recipe.ingredienti) {
    if (ing.scalabile) continue
    const info = ingredientInfo(ing.nome)
    if (info?.contaCho) choFissiG += (ing.grammiBase * info.cho) / 100
  }

  const ingredienti: ScaledIngredient[] = recipe.ingredienti.map((ing) => {
    if (!ing.scalabile) return { nome: ing.nome, grammi: ing.grammiBase }
    const grammi =
      opts.scalabileGrammi ??
      (opts.density > 0 ? Math.max(0, Math.round(((opts.targetChoG - choFissiG) * 100) / opts.density)) : ing.grammiBase)
    return { nome: ing.nome, grammi, scalabile: true }
  })

  const macro: RecipeMacros = { cho: 0, prot: 0, fat: 0 }
  for (const ing of ingredienti) {
    const info = ingredientInfo(ing.nome)
    if (ing.scalabile) macro.cho += (ing.grammi * opts.density) / 100
    else if (info?.contaCho) macro.cho += (ing.grammi * info.cho) / 100
    if (info) {
      macro.prot += (ing.grammi * info.prot) / 100
      macro.fat += (ing.grammi * info.fat) / 100
    }
  }

  return {
    ingredienti,
    scalabile: ingredienti.find((i) => i.scalabile),
    density: opts.density,
    choFissiG: Math.round(choFissiG * 10) / 10,
    macro,
  }
}

/** Elenco ricette adatte a un dato pasto (picker in UI e rotazione). */
export function recipesForMeal(recipes: Recipe[], meal: MealType) {
  return recipes.filter((r) => r.pastoConsigliato === meal)
}
