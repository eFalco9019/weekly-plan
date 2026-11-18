import type { MealType } from '../types'

/** Un pasto con il carboidrato regolabile, per la compensazione del giorno. */
export interface EngineMeal {
  meal: MealType
  /** Target di carboidrati del pasto (g). */
  target: number
  /** Grammi attuali dell'alimento (o dell'ingrediente) che regola i carboidrati. */
  grammi: number
  /** g di carboidrati per 100 g di quell'alimento. */
  density: number
  /** Carboidrati del pasto che non dipendono dai grammi regolabili (es. ceci di una ricetta). */
  fissi?: number
  bloccato?: boolean
}

export const mealCho = (m: Pick<EngineMeal, 'grammi' | 'density' | 'fissi'>) => (m.grammi * m.density) / 100 + (m.fissi ?? 0)

/**
 * Compensazione: l'utente ha cambiato i grammi di `edited`; lo scostamento
 * dal suo target si toglie (o si aggiunge) agli altri pasti non bloccati,
 * in proporzione ai loro target, così il totale del giorno resta quello del
 * piano. Restituisce i nuovi grammi dei pasti ricalcolati.
 */
export function rebalanceDay(meals: EngineMeal[], edited: MealType): Partial<Record<MealType, number>> {
  const e = meals.find((m) => m.meal === edited)
  if (!e) return {}
  const delta = mealCho(e) - e.target
  const free = meals.filter((m) => m.meal !== edited && !m.bloccato && m.density > 0)
  const totalFree = free.reduce((s, m) => s + m.target, 0)
  const out: Partial<Record<MealType, number>> = {}
  if (delta === 0 || free.length === 0) return out
  for (const m of free) {
    const share = totalFree > 0 ? (delta * m.target) / totalFree : delta / free.length
    out[m.meal] = Math.max(0, Math.round(((m.target - share - (m.fissi ?? 0)) * 100) / m.density))
  }
  return out
}
