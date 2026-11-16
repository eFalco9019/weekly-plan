import type { MealState } from '../hooks/useDayPlan'
import type { MealType } from '../types'
import { recipes } from '../data/recipes'

/** Categorie che descrivono il "piatto" di un pasto, in ordine di lettura. */
const dishCategories: Record<MealType, string[]> = {
  colazione: ['carboidrati', 'proteine', 'grassi', 'frutta'],
  pranzo: ['carboidrati', 'proteine', 'verdura'],
  spuntino: ['fruttaGrassi', 'alternativePome', 'frutta', 'proteine'],
  cena: ['carboidrati', 'proteine', 'verdura'],
}

/** Toglie le note tecniche tra parentesi (es. "(~11g prot/100g)"). */
function clean(alimento: string) {
  return alimento.replace(/\s*\(.*?\)\s*/g, ' ').trim()
}

/**
 * Descrive il pasto come lo si legge in un menu: il nome della ricetta
 * se ne è assegnata una, altrimenti gli alimenti scelti per categoria
 * (es. "Riso basmati + Petto di pollo + Broccoli").
 */
export function describeMeal(meal: MealType, mealState: MealState | undefined): string | null {
  if (!mealState) return null
  const recipeId = mealState.scelte.carboidrati?.recipeId
  if (recipeId) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (recipe) return recipe.nome
  }
  const parts: string[] = []
  for (const cat of dishCategories[meal]) {
    const scelta = mealState.scelte[cat]
    if (scelta?.alimento) parts.push(clean(scelta.alimento))
  }
  // Categorie non previste sopra (piani futuri con categorie diverse).
  if (parts.length === 0) {
    for (const scelta of Object.values(mealState.scelte)) if (scelta.alimento) parts.push(clean(scelta.alimento))
  }
  return parts.length > 0 ? parts.join(' + ') : null
}
