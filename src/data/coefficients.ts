import type { DayType, MealTemplate, ProfileId } from '../types'

/**
 * Coefficienti del piano di un profilo (fase 0 della roadmap): da questi
 * l'app ricava i target di ogni giorno e di ogni pasto, al posto dei target
 * scritti a mano settimana per settimana.
 *
 * Quelli di Arianna sono ricavati dal suo piano (settimana 1 della
 * dietista) e lo riproducono: target di carboidrati delle 4 settimane, ON e
 * OFF, entro 0,5 g (solo arrotondamento). Le quote di proteine vengono
 * dalle porzioni proteiche equivalenti delle tabelle (colazione ~25 g,
 * pranzo ~30 g, spuntino ~11 g, cena ~53 g: sommate ~120 g, il totale del
 * piano). Per i grassi il piano indica solo il pranzo.
 */
export type TrackedMeal = 'colazione' | 'pranzo' | 'cena'

export interface PlanCoefficients {
  profile: ProfileId
  pesoKg: number
  /** Proteine e grassi giornalieri in g per kg di peso, fissi in tutte le settimane. */
  proteineGKg: number
  grassiGKg: number
  /** Carboidrati del giorno in settimana 1, per tipo di giorno. */
  choGiornoSett1: Record<DayType, number>
  /** Grammi di carboidrati aggiunti ogni settimana del ciclo. */
  choIncrementoSettimanale: Record<DayType, number>
  settimane: number
  /** Parte dei carboidrati del giorno lasciata allo spuntino (libero, non tracciato a grammi). */
  choSpuntinoG: number
  /** Quota (%) del resto dei carboidrati per colazione, pranzo e cena, per tipo di giorno. */
  quoteCho: Record<DayType, Record<TrackedMeal, number>>
  /** Quota (%) delle proteine del giorno per pasto (somma 100). */
  quoteProteine: Record<TrackedMeal | 'spuntino', number>
  /** Grassi del pranzo indicati dal piano (g); per gli altri pasti il piano non li indica. */
  grassiPranzoG?: number
}

export const coefficients: PlanCoefficients[] = [
  {
    profile: 'arianna',
    pesoKg: 60,
    proteineGKg: 2,
    grassiGKg: 0.8,
    choGiornoSett1: { ON: 190, OFF: 150 },
    choIncrementoSettimanale: { ON: 10, OFF: 10 },
    settimane: 4,
    choSpuntinoG: 52.5,
    quoteCho: {
      ON: { colazione: 34.5, pranzo: 36.4, cena: 29.1 },
      OFF: { colazione: 33.3, pranzo: 41.0, cena: 25.6 },
    },
    quoteProteine: { colazione: 21, pranzo: 25, spuntino: 9, cena: 45 },
    grassiPranzoG: 15,
  },
]

export function coefficientsFor(profile: ProfileId): PlanCoefficients | undefined {
  return coefficients.find((c) => c.profile === profile)
}

const r05 = (x: number) => Math.round(x * 2) / 2

/** Carboidrati totali del giorno per settimana e tipo di giorno. */
export function choGiorno(c: PlanCoefficients, week: number, dayType: DayType): number {
  return c.choGiornoSett1[dayType] + c.choIncrementoSettimanale[dayType] * (week - 1)
}

/** Target dei pasti di una settimana, calcolati dai coefficienti. */
export function templatesFromCoefficients(c: PlanCoefficients, week: number): MealTemplate[] {
  const cho = (meal: TrackedMeal, dayType: DayType) =>
    r05(((choGiorno(c, week, dayType) - c.choSpuntinoG) * c.quoteCho[dayType][meal]) / 100)
  const proteine = c.proteineGKg * c.pesoKg
  const prot = (meal: keyof PlanCoefficients['quoteProteine']) => r05((proteine * c.quoteProteine[meal]) / 100)
  return [
    { week, meal: 'colazione', targetChoOnG: cho('colazione', 'ON'), targetChoOffG: cho('colazione', 'OFF'), targetProteinG: prot('colazione') },
    {
      week,
      meal: 'pranzo',
      targetChoOnG: cho('pranzo', 'ON'),
      targetChoOffG: cho('pranzo', 'OFF'),
      targetProteinG: prot('pranzo'),
      targetFatG: c.grassiPranzoG,
    },
    { week, meal: 'cena', targetChoOnG: cho('cena', 'ON'), targetChoOffG: cho('cena', 'OFF'), targetProteinG: prot('cena') },
    // Lo spuntino è a scelta libera: nessun target di carboidrati tracciato (il motore non lo usa).
    { week, meal: 'spuntino', targetChoOnG: 0, targetChoOffG: 0, targetProteinG: prot('spuntino') },
  ]
}
