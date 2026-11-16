import type { MealTemplate } from '../types'
import { week1Colazione, week1Pranzo, week1Cena, week1Spuntino } from './week1'
import { scaleCarbGroup, carryOverGroup } from './weekBuilder'

// Settimana 4: ON 220g / OFF 180g totali.
// Somma target trackable: ON 167.5g -> 58+61+49=168 (≈, "circa")
//                          OFF 127.5g -> 42.5+52+33=127.5 (esatto)
export const week4Templates: MealTemplate[] = [
  { week: 4, meal: 'colazione', targetChoOnG: 58, targetChoOffG: 42.5 },
  { week: 4, meal: 'pranzo', targetChoOnG: 61, targetChoOffG: 52, targetProteinG: 30, targetFatG: 15 },
  { week: 4, meal: 'cena', targetChoOnG: 49, targetChoOffG: 33 },
  { week: 4, meal: 'spuntino', targetChoOnG: 0, targetChoOffG: 0 },
]

export const week4Colazione = {
  carboidrati: scaleCarbGroup('colazione', week4Templates[0], week1Colazione.carboidrati),
  proteine: carryOverGroup(week1Colazione.proteine),
  grassi: carryOverGroup(week1Colazione.grassi),
  frutta: carryOverGroup(week1Colazione.frutta),
}

export const week4Pranzo = {
  verdura: carryOverGroup(week1Pranzo.verdura),
  carboidrati: scaleCarbGroup('pranzo', week4Templates[1], week1Pranzo.carboidrati),
  proteine: carryOverGroup(week1Pranzo.proteine),
}

export const week4Cena = {
  verdura: carryOverGroup(week1Cena.verdura),
  carboidrati: scaleCarbGroup('cena', week4Templates[2], week1Cena.carboidrati),
  proteine: carryOverGroup(week1Cena.proteine),
}

export const week4Spuntino = {
  fruttaGrassi: carryOverGroup(week1Spuntino.fruttaGrassi),
  alternativePome: carryOverGroup(week1Spuntino.alternativePome),
}
