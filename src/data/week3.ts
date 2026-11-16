import type { MealTemplate } from '../types'
import { week1Colazione, week1Pranzo, week1Cena, week1Spuntino } from './week1'
import { scaleCarbGroup, carryOverGroup } from './weekBuilder'

// Settimana 3: ON 210g / OFF 170g totali.
// Somma target trackable: ON 157.5g -> 54.5+57+46=157.5 (esatto)
//                          OFF 117.5g -> 39+48+30=117 (≈, "circa")
export const week3Templates: MealTemplate[] = [
  { week: 3, meal: 'colazione', targetChoOnG: 54.5, targetChoOffG: 39 },
  { week: 3, meal: 'pranzo', targetChoOnG: 57, targetChoOffG: 48, targetProteinG: 30, targetFatG: 15 },
  { week: 3, meal: 'cena', targetChoOnG: 46, targetChoOffG: 30 },
  { week: 3, meal: 'spuntino', targetChoOnG: 0, targetChoOffG: 0 },
]

export const week3Colazione = {
  carboidrati: scaleCarbGroup('colazione', week3Templates[0], week1Colazione.carboidrati),
  proteine: carryOverGroup(week1Colazione.proteine),
  grassi: carryOverGroup(week1Colazione.grassi),
  frutta: carryOverGroup(week1Colazione.frutta),
}

export const week3Pranzo = {
  verdura: carryOverGroup(week1Pranzo.verdura),
  carboidrati: scaleCarbGroup('pranzo', week3Templates[1], week1Pranzo.carboidrati),
  proteine: carryOverGroup(week1Pranzo.proteine),
}

export const week3Cena = {
  verdura: carryOverGroup(week1Cena.verdura),
  carboidrati: scaleCarbGroup('cena', week3Templates[2], week1Cena.carboidrati),
  proteine: carryOverGroup(week1Cena.proteine),
}

export const week3Spuntino = {
  fruttaGrassi: carryOverGroup(week1Spuntino.fruttaGrassi),
  alternativePome: carryOverGroup(week1Spuntino.alternativePome),
}
