import type { MealTemplate } from '../types'
import { week1Colazione, week1Pranzo, week1Cena, week1Spuntino } from './week1'
import { scaleCarbGroup, carryOverGroup } from './weekBuilder'

// Settimana 2: +10g CHO/giorno rispetto a Settimana 1 (ON 200g / OFF 160g
// totali, cfr. indicazioni di Ezio). Il target di ogni pasto è scalato
// proporzionalmente al target di Settimana 1 (lo spuntino non ha un
// target di CHO esplicito e resta fisso, come in Settimana 1).
//
// Somma target trackable (colazione+pranzo+cena):
//  ON  147.5g (200 - 52.5 di spuntino fisso) -> 51+54+43=148 (≈, "circa")
//  OFF 107.5g (160 - 52.5)                   -> 36+44+28=108 (≈, "circa")
export const week2Templates: MealTemplate[] = [
  { week: 2, meal: 'colazione', targetChoOnG: 51, targetChoOffG: 36 },
  { week: 2, meal: 'pranzo', targetChoOnG: 54, targetChoOffG: 44, targetProteinG: 30, targetFatG: 15 },
  { week: 2, meal: 'cena', targetChoOnG: 43, targetChoOffG: 28 },
  { week: 2, meal: 'spuntino', targetChoOnG: 0, targetChoOffG: 0 },
]

export const week2Colazione = {
  carboidrati: scaleCarbGroup('colazione', week2Templates[0], week1Colazione.carboidrati),
  proteine: carryOverGroup(week1Colazione.proteine),
  grassi: carryOverGroup(week1Colazione.grassi),
  frutta: carryOverGroup(week1Colazione.frutta),
}

export const week2Pranzo = {
  verdura: carryOverGroup(week1Pranzo.verdura),
  carboidrati: scaleCarbGroup('pranzo', week2Templates[1], week1Pranzo.carboidrati),
  proteine: carryOverGroup(week1Pranzo.proteine),
}

export const week2Cena = {
  verdura: carryOverGroup(week1Cena.verdura),
  carboidrati: scaleCarbGroup('cena', week2Templates[2], week1Cena.carboidrati),
  proteine: carryOverGroup(week1Cena.proteine),
}

export const week2Spuntino = {
  fruttaGrassi: carryOverGroup(week1Spuntino.fruttaGrassi),
  alternativePome: carryOverGroup(week1Spuntino.alternativePome),
}
