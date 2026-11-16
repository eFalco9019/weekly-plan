import type { MealState } from '../hooks/useDayPlan'
import type { MealType } from '../types'
import { ingredientInfo } from '../data/ingredients'
import { foodComponents } from '../data/foodComponents'
import { recipes } from '../data/recipes'
import { scaleRecipe } from './recipeEngine'

/**
 * Proteine e grassi effettivi di un pasto, dalle scelte del giorno e
 * dall'archivio ingredienti (valori indicativi).
 * - Proteine: solo dalle fonti proteiche (ingredienti di categoria
 *   "proteine": yogurt, carne, pesce, uova, latticini…), come conta il
 *   piano della dietista — così il totale è confrontabile con il target.
 * - Grassi: da tutti gli ingredienti, compreso l'olio indicato nel piano.
 * I carboidrati restano calcolati come nel piano (fonti amidacee e loro
 * densità), vedi calcMealChoBreakdown.
 */
export function mealMacros(meal: MealType, mealState: MealState | undefined): { prot: number; fat: number } {
  const out = { prot: 0, fat: 0 }
  if (!mealState) return out
  const add = (nome: string, grammi: number) => {
    const info = ingredientInfo(nome)
    if (!info) return
    if (info.cat === 'proteine') out.prot += (grammi * info.prot) / 100
    out.fat += (grammi * info.fat) / 100
  }
  const carbo = mealState.scelte.carboidrati
  const recipe = carbo?.recipeId ? recipes.find((r) => r.id === carbo.recipeId) : undefined
  if (recipe && carbo) {
    const scaled = scaleRecipe(recipe, { targetChoG: 0, density: carbo.choPer100gOverride ?? 0, scalabileGrammi: carbo.grammi })
    for (const ing of scaled.ingredienti) add(ing.nome, ing.grammi)
    return out
  }
  for (const scelta of Object.values(mealState.scelte)) {
    if (!scelta?.alimento || scelta.grammi <= 0) continue
    for (const c of foodComponents(meal, scelta.alimento, scelta.grammi)) add(c.nome, c.grammi)
  }
  return out
}
