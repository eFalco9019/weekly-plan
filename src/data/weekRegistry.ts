import type { FoodEquivalent, MealTemplate, MealType } from '../types'
import { week1Templates, week1Colazione, week1Pranzo, week1Cena, week1Spuntino } from './week1'
import { week2Templates, week2Colazione, week2Pranzo, week2Cena, week2Spuntino } from './week2'
import { week3Templates, week3Colazione, week3Pranzo, week3Cena, week3Spuntino } from './week3'
import { week4Templates, week4Colazione, week4Pranzo, week4Cena, week4Spuntino } from './week4'

export interface WeekData {
  templates: MealTemplate[]
  colazione: Record<string, FoodEquivalent[]>
  pranzo: Record<string, FoodEquivalent[]>
  cena: Record<string, FoodEquivalent[]>
  spuntino: Record<string, FoodEquivalent[]>
}

export const weeks: Record<number, WeekData> = {
  1: { templates: week1Templates, colazione: week1Colazione, pranzo: week1Pranzo, cena: week1Cena, spuntino: week1Spuntino },
  2: { templates: week2Templates, colazione: week2Colazione, pranzo: week2Pranzo, cena: week2Cena, spuntino: week2Spuntino },
  3: { templates: week3Templates, colazione: week3Colazione, pranzo: week3Pranzo, cena: week3Cena, spuntino: week3Spuntino },
  4: { templates: week4Templates, colazione: week4Colazione, pranzo: week4Pranzo, cena: week4Cena, spuntino: week4Spuntino },
}

import type { ProfileId } from '../types'
import { coefficientsFor, dailyFixedMacros, templatesFromCoefficients } from './coefficients'

/**
 * Le tabelle sopra sono quelle del piano di Arianna (dietista). Per un altro
 * profilo si ricavano dalla settimana 1:
 * - fonti di carboidrati: grammi = target del pasto del profilo / densità di
 *   CHO dell'alimento (la stessa del piano), come già tra le settimane;
 * - fonti proteiche e spuntini proteici: grammi × (proteine del profilo / 120);
 * - fonti di grassi e spuntini frutta + grassi: grammi × (grassi del profilo / 48);
 * - frutta e verdura invariate.
 */
const REFERENCE: ProfileId = 'arianna'
const proteinCategories = new Set(['proteine', 'alternativePome'])
const fatCategories = new Set(['grassi', 'fruttaGrassi'])
const cache = new Map<string, Record<string, FoodEquivalent[]>>()

function scaledFactors(profile: ProfileId) {
  const ref = dailyFixedMacros(coefficientsFor(REFERENCE)!)
  const own = coefficientsFor(profile)
  if (!own) return { prot: 1, fat: 1 }
  const m = dailyFixedMacros(own)
  return { prot: m.proteine / ref.proteine, fat: m.grassi / ref.grassi }
}

export function mealEquivalentsForWeek(
  week: number,
  meal: MealType,
  profile: ProfileId = REFERENCE,
): Record<string, FoodEquivalent[]> {
  const data = weeks[week] ?? weeks[1]
  if (profile === REFERENCE || !coefficientsFor(profile)) return data[meal]
  const key = `${profile}|${week}|${meal}`
  const hit = cache.get(key)
  if (hit) return hit
  const template = templatesForWeek(week, profile).find((t) => t.meal === meal)
  const { prot, fat } = scaledFactors(profile)
  const base = weeks[1][meal]
  const out: Record<string, FoodEquivalent[]> = {}
  for (const [categoria, items] of Object.entries(base)) {
    out[categoria] = items.map((it) => {
      if (categoria === 'carboidrati' && it.choPer100g && template) {
        return {
          ...it,
          grammiOn: Math.round((template.targetChoOnG * 100) / it.choPer100g),
          grammiOff: Math.round((template.targetChoOffG * 100) / it.choPer100g),
        }
      }
      const f = proteinCategories.has(categoria) ? prot : fatCategories.has(categoria) ? fat : 1
      return f === 1 ? it : { ...it, grammiOn: Math.round(it.grammiOn * f), grammiOff: Math.round(it.grammiOff * f) }
    })
  }
  cache.set(key, out)
  return out
}

export function templatesForWeek(week: number, profile: ProfileId = REFERENCE): MealTemplate[] {
  if (profile === REFERENCE) return (weeks[week] ?? weeks[1]).templates
  const c = coefficientsFor(profile) ?? coefficientsFor(REFERENCE)!
  return templatesFromCoefficients(c, week)
}
