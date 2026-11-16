import type { DayState, MealChoice } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { recipes } from '../data/recipes'
import { scaleRecipe } from './recipeEngine'
import { ingredientInfo } from '../data/ingredients'
import { foodComponents } from '../data/foodComponents'

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
  aromi: 'Erbe e aromi',
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

/** Ingredienti di un pasto-ricetta, con la grammatura effettiva
 * dell'ingrediente scalabile (già adattata al target / compensata). */
function recipeMealGrams(scelta: MealChoice): { nome: string; categoria: string; grammi: number }[] {
  const recipe = recipes.find((r) => r.id === scelta.recipeId)
  if (!recipe) return []
  const scaled = scaleRecipe(recipe, {
    targetChoG: 0,
    density: scelta.choPer100gOverride ?? 0,
    scalabileGrammi: scelta.grammi,
  })
  return scaled.ingredienti.map((ing) => ({
    nome: ing.nome,
    // Stesso reparto degli alimenti da tabella, così lo stesso alimento
    // (es. merluzzo) si somma invece di finire in un gruppo a parte.
    categoria: ingredientInfo(ing.nome)?.cat ?? 'aromi',
    grammi: ing.grammi,
  }))
}

/** Nome da lista della spesa: senza le note tra parentesi del piano
 * ("Philadelphia Active (~11g prot/100g)" diventa "Philadelphia Active"). */
export function shoppingName(nome: string): string {
  const clean = nome.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : nome
}

export function buildShoppingList(entries: DayPlanEntry[]): ShoppingItem[] {
  const totals = new Map<string, ShoppingItem>()

  for (const entry of entries) {
    for (const meal of ['colazione', 'pranzo', 'cena', 'spuntino'] as MealType[]) {
      const mealState = entry.state[meal]
      if (!mealState) continue
      const recipeChoice = mealState.scelte.carboidrati
      // Un pasto-ricetta è la ricetta intera: le altre categorie del pasto
      // non vanno comprate (niente doppio conteggio).
      const groups: { nome: string; categoria: string; grammi: number }[][] = recipeChoice?.recipeId
        ? [recipeMealGrams(recipeChoice)]
        : Object.entries(mealState.scelte)
            .filter(([, scelta]) => scelta && scelta.grammi > 0)
            // Alimenti composti del piano ("uovo + albume", "frutta + noci",
            // proteina + olio EVO) diventano i singoli ingredienti da comprare.
            .map(([categoria, scelta]) =>
              foodComponents(meal, scelta.alimento, scelta.grammi).map((c) => ({
                nome: c.nome,
                categoria: c.nome === scelta.alimento ? categoria : (ingredientInfo(c.nome)?.cat ?? categoria),
                grammi: c.grammi,
              })),
            )
      for (const items of groups) {
        for (const item of items) {
          const nome = shoppingName(item.nome)
          const key = `${nome.toLowerCase()}__${item.categoria}`
          const existing = totals.get(key)
          if (existing) {
            existing.grammi += item.grammi
          } else {
            totals.set(key, { ...item, nome })
          }
        }
      }
    }
  }

  return Array.from(totals.values())
    .map((item) => ({ ...item, grammi: Math.round(item.grammi) }))
    .sort((a, b) => a.nome.localeCompare(b.nome))
}
