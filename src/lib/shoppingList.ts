import type { DayState, MealChoice } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { recipes } from '../data/recipes'
import { scaleRecipeToMeal } from './recipeEngine'

export interface ShoppingItem {
  nome: string
  categoria: string
  grammi: number
}

const categoriaLabels: Record<string, string> = {
  carboidrati: 'Carboidrati',
  proteine: 'Proteine',
  grassi: 'Grassi',
  frutta: 'Frutta',
  verdura: 'Verdure',
  fruttaGrassi: 'Frutta + grassi',
  alternativePome: 'Alternative pomeridiane',
  ricetta: 'Da ricette',
}

export function categoriaLabel(categoria: string): string {
  return categoriaLabels[categoria] ?? categoria
}

/** Un giorno di piano da aggregare nella lista della spesa (già risolto
 * per profilo+data, salvato o di default). */
export interface DayPlanEntry {
  week: number
  dayType: DayType
  state: DayState
  templates: MealTemplate[]
}

function mealChoiceGrams(
  meal: MealType,
  categoria: string,
  scelta: MealChoice,
  templates: MealTemplate[],
  dayType: DayType,
): { nome: string; categoria: string; grammi: number }[] {
  if (categoria === 'carboidrati' && scelta.recipeId) {
    const recipe = recipes.find((r) => r.id === scelta.recipeId)
    if (!recipe) return []
    const template = templates.find((t) => t.meal === meal)
    const targetCho = template ? (dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG) : 0
    const scaled = scaleRecipeToMeal(recipe, { targetChoG: targetCho, porzioni: 1 })
    return scaled.map((ing) => ({ nome: ing.nome, categoria: 'ricetta', grammi: ing.grammi }))
  }
  return [{ nome: scelta.alimento, categoria, grammi: scelta.grammi }]
}

/**
 * Aggrega gli ingredienti di più giorni (es. i 7 giorni di una settimana,
 * eventualmente per più profili) in un'unica lista della spesa, con le
 * grammature totali per ingrediente.
 *
 * Nota: se un pasto ha sia una ricetta assegnata sia altre categorie a
 * tabella (es. proteine), entrambe vengono conteggiate — è lo stesso
 * comportamento del drill-down giornaliero (MealSection), che non
 * deduplica automaticamente gli ingredienti di una ricetta con le
 * categorie standard dello stesso pasto.
 */
export function buildShoppingList(entries: DayPlanEntry[]): ShoppingItem[] {
  const totals = new Map<string, ShoppingItem>()

  for (const entry of entries) {
    for (const meal of ['colazione', 'pranzo', 'cena', 'spuntino'] as MealType[]) {
      const mealState = entry.state[meal]
      if (!mealState) continue
      for (const [categoria, scelta] of Object.entries(mealState.scelte)) {
        if (!scelta || scelta.grammi <= 0) continue
        const items = mealChoiceGrams(meal, categoria, scelta, entry.templates, entry.dayType)
        for (const item of items) {
          const key = `${item.nome}__${item.categoria}`
          const existing = totals.get(key)
          if (existing) {
            existing.grammi += item.grammi
          } else {
            totals.set(key, { ...item })
          }
        }
      }
    }
  }

  return Array.from(totals.values())
    .map((item) => ({ ...item, grammi: Math.round(item.grammi) }))
    .sort((a, b) => a.nome.localeCompare(b.nome))
}
