import type { DayType, FoodEquivalent, MealTemplate, MealType } from '../types'
import { template } from './template'

export type TrackedMeal = 'colazione' | 'pranzo' | 'cena'
export const trackedMeals: TrackedMeal[] = ['colazione', 'pranzo', 'cena']

/**
 * Il piano di una persona: i fabbisogni che imposta lei, sulla base delle
 * indicazioni del suo professionista. Da qui l'app ricava i target di ogni
 * pasto e le grammature delle tabelle di equivalenza (src/data/template.ts).
 */
export interface Piano {
  /** Carboidrati del giorno nella settimana 1 del ciclo. */
  choGiorno: Record<DayType, number>
  /** Grammi di carboidrati in più a ogni settimana del ciclo. */
  choIncremento: Record<DayType, number>
  settimane: number
  /** Carboidrati dello spuntino: porzioni fisse da tabella, contano nel totale del giorno. */
  choSpuntinoG: number
  proteineG: number
  grassiG: number
  /** Quota (%) dei carboidrati restanti (totale − spuntino) per pasto. */
  quoteCho: Record<DayType, Record<TrackedMeal, number>>
  /** Quota (%) delle proteine del giorno per pasto. */
  quoteProteine: Record<MealType, number>
}

/** Il piano della dietista di Arianna: è il riferimento delle tabelle del template. */
export const pianoRiferimento: Piano = {
  choGiorno: { ON: 190, OFF: 150 },
  choIncremento: { ON: 10, OFF: 10 },
  settimane: 4,
  choSpuntinoG: 52.5,
  proteineG: 120,
  grassiG: 48,
  quoteCho: {
    ON: { colazione: 34.5, pranzo: 36.4, cena: 29.1 },
    OFF: { colazione: 33.3, pranzo: 41.0, cena: 25.6 },
  },
  quoteProteine: { colazione: 21, pranzo: 25, spuntino: 9, cena: 45 },
}

/**
 * Stima provvisoria per Ezio (16/11/2026), da sostituire con i valori del
 * professionista: 87,5 kg, proteine 1,8 g/kg, grassi 0,9 g/kg, carboidrati
 * ON 5 g/kg e OFF 3,5 g/kg, senza progressione; quote come il riferimento.
 */
export const pianoStimaEzio: Piano = {
  ...pianoRiferimento,
  choGiorno: { ON: 440, OFF: 300 },
  choIncremento: { ON: 0, OFF: 0 },
  choSpuntinoG: 120,
  proteineG: 158,
  grassiG: 79,
}

const r05 = (x: number) => Math.round(x * 2) / 2

export function choGiorno(p: Piano, week: number, dayType: DayType): number {
  return p.choGiorno[dayType] + p.choIncremento[dayType] * (Math.min(Math.max(week, 1), p.settimane) - 1)
}

export function kcal(p: Piano, week: number, dayType: DayType): number {
  return Math.round(4 * (choGiorno(p, week, dayType) + p.proteineG) + 9 * p.grassiG)
}

/** Ripartisce `totale` secondo le quote, arrotondando a 0,5 g senza perdere grammi. */
function split(totale: number, quote: Record<TrackedMeal, number>): Record<TrackedMeal, number> {
  const raw = trackedMeals.map((m) => (totale * quote[m]) / 100)
  const out = raw.map(r05)
  const scarto = r05(totale - out.reduce((a, b) => a + b, 0))
  if (scarto !== 0) {
    let i = 0
    raw.forEach((r, k) => {
      if (Math.abs(r - out[k]) > Math.abs(raw[i] - out[i])) i = k
    })
    out[i] += scarto
  }
  return { colazione: out[0], pranzo: out[1], cena: out[2] }
}

const cache = new WeakMap<Piano, Map<string, unknown>>()
function memo<T>(p: Piano, key: string, make: () => T): T {
  let m = cache.get(p)
  if (!m) cache.set(p, (m = new Map()))
  if (!m.has(key)) m.set(key, make())
  return m.get(key) as T
}

/** Target dei pasti di una settimana. Lo spuntino ha carboidrati fissi, fuori dalla compensazione. */
export function mealTargets(p: Piano, week: number): MealTemplate[] {
  return memo(p, `t${week}`, () => {
    const on = split(choGiorno(p, week, 'ON') - p.choSpuntinoG, p.quoteCho.ON)
    const off = split(choGiorno(p, week, 'OFF') - p.choSpuntinoG, p.quoteCho.OFF)
    const prot = (m: MealType) => r05((p.proteineG * p.quoteProteine[m]) / 100)
    return [
      ...trackedMeals.map((meal) => ({ week, meal, targetChoOnG: on[meal], targetChoOffG: off[meal], targetProteinG: prot(meal) })),
      { week, meal: 'spuntino', targetChoOnG: 0, targetChoOffG: 0, choFissoG: p.choSpuntinoG, targetProteinG: prot('spuntino') },
    ]
  })
}

export function mealTarget(p: Piano, week: number, meal: MealType): MealTemplate {
  return mealTargets(p, week).find((t) => t.meal === meal)!
}

/**
 * Tabelle di equivalenza di un pasto per un piano e una settimana, scalate
 * dal template (che vale per `pianoRiferimento`, settimana 1):
 * - carboidrati: grammi = target del pasto / densità di CHO, con la densità
 *   implicita nella tabella della dietista (target ON / grammi ON);
 * - proteine: in proporzione alle proteine del pasto;
 * - grassi: in proporzione ai grassi del giorno;
 * - spuntino: in proporzione ai suoi carboidrati fissi;
 * - verdura e frutta: invariate.
 */
export function equivalents(p: Piano, week: number, meal: MealType): Record<string, FoodEquivalent[]> {
  return memo(p, `e${week}${meal}`, () => {
    const t = mealTarget(p, week, meal)
    const ref = mealTarget(pianoRiferimento, 1, meal)
    const factor = (categoria: string) =>
      meal === 'spuntino'
        ? p.choSpuntinoG / pianoRiferimento.choSpuntinoG
        : categoria === 'proteine'
          ? (t.targetProteinG ?? 0) / (ref.targetProteinG ?? 1)
          : categoria === 'grassi'
            ? p.grassiG / pianoRiferimento.grassiG
            : 1
    const out: Record<string, FoodEquivalent[]> = {}
    for (const [categoria, foods] of Object.entries(template[meal])) {
      out[categoria] = foods.map(([alimento, on, off]) => {
        if (categoria === 'carboidrati') {
          // Con i target del riferimento restano le grammature della dietista;
          // altrimenti grammi = target / densità.
          const choPer100g = Math.round(((ref.targetChoOnG * 100) / on) * 10) / 10
          const grams = (target: number, refTarget: number, refGrams: number) =>
            target === refTarget ? refGrams : Math.round((target * 100) / choPer100g)
          return {
            alimento,
            grammiOn: grams(t.targetChoOnG, ref.targetChoOnG, on),
            grammiOff: grams(t.targetChoOffG, ref.targetChoOffG, off),
            choPer100g,
          }
        }
        const f = factor(categoria)
        return { alimento, grammiOn: Math.round(on * f), grammiOff: Math.round(off * f) }
      })
    }
    return out
  })
}

/** Controlli del piano prima di salvarlo; restituisce i problemi da correggere. */
export function checkPiano(p: Piano): string[] {
  const errors: string[] = []
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)
  for (const d of ['ON', 'OFF'] as DayType[]) {
    if (Math.abs(sum(p.quoteCho[d]) - 100) > 0.5) errors.push(`Le quote dei carboidrati ${d} devono fare 100%.`)
    if (p.choGiorno[d] <= p.choSpuntinoG) errors.push(`I carboidrati ${d} devono superare quelli dello spuntino.`)
  }
  if (Math.abs(sum(p.quoteProteine) - 100) > 0.5) errors.push('Le quote delle proteine devono fare 100%.')
  if (p.proteineG <= 0 || p.grassiG <= 0) errors.push('Proteine e grassi devono essere maggiori di zero.')
  if (p.settimane < 1 || p.settimane > 12) errors.push('Il ciclo va da 1 a 12 settimane.')
  return errors
}
