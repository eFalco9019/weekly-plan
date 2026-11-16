import type { MealType } from '../types'

/** Ordine dei pasti nella giornata (usato da anelli, tabelle, vista settimanale). */
export const mealOrder: MealType[] = ['colazione', 'pranzo', 'spuntino', 'cena']

export const mealLabels: Record<MealType, string> = {
  colazione: 'Colazione',
  pranzo: 'Pranzo',
  spuntino: 'Spuntino',
  cena: 'Cena',
}

export const mealIcons: Record<MealType, string> = {
  colazione: '🌅',
  pranzo: '🍝',
  spuntino: '🍎',
  cena: '🍽️',
}

/** Colore del pasto (token CSS), condiviso da anelli, legenda e bordo delle card pasto. */
export const mealColor = (meal: MealType) => `var(--meal-${meal})`
