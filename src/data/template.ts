import type { MealType } from '../types'

/**
 * Template dei piani: le tabelle di equivalenza della dietista di Arianna
 * (settimana 1). Per ogni pasto e categoria, gli alimenti intercambiabili
 * con la grammatura del giorno ON e del giorno OFF.
 *
 * Le grammature valgono per i target di riferimento (`pianoRiferimento` in
 * src/data/piano.ts): per un altro piano o un'altra settimana si scalano in
 * src/data/piano.ts. Verdure e frutta restano fisse.
 */
export type RefFood = readonly [alimento: string, grammiOn: number, grammiOff: number]

const fixed = (grammi: number, ...alimenti: string[]): RefFood[] => alimenti.map((a) => [a, grammi, grammi])

export const template: Record<MealType, Record<string, RefFood[]>> = {
  colazione: {
    carboidrati: [
      ['Pane tostato', 85, 60],
      ['Biscotti senza zuccheri aggiunti', 60, 40],
      ['Muesli', 65, 45],
      ['Farina di riso', 55, 38],
      ['Gallette grano saraceno', 60, 40],
      ["Granola d'avena", 65, 45],
      ['Gallette di riso', 55, 38],
      ["Farina d'avena", 65, 45],
      ['Fiocchi di riso', 55, 38],
      ["Fiocchi d'avena", 65, 45],
    ],
    proteine: [
      ['Yogurt greco 0%', 250, 250],
      ['Proteine whey isolate 90%', 28, 28],
      ['Philadelphia Active (~11g prot/100g)', 220, 220],
      ['Albume', 230, 230],
      ['1 uovo intero + albume', 180, 180],
    ],
    grassi: [
      ['Cocco grattugiato', 10, 10],
      ['Cioccolato fondente 85%', 15, 15],
      ['Burro ghee', 10, 10],
      ['Burro 100% frutta secca', 15, 15],
      ['Noci o nocciole', 15, 15],
    ],
    frutta: [
      ['Frutta fresca', 40, 40],
      ['Marmellata Hero Light', 30, 30],
    ],
  },
  pranzo: {
    verdura: fixed(200, 'Zucca gialla', 'Broccoli o cime di rapa', 'Valeriana', 'Radicchio rosso', 'Zucchine', 'Finocchi', 'Fagiolini', 'Carote', 'Bieta'),
    carboidrati: [
      ['Riso basmati', 65, 52],
      ['Patate', 300, 240],
      ['Piadina integrale', 75, 60],
      ['Pasta grano saraceno', 70, 55],
      ['Gallette grano saraceno', 65, 52],
      ['Grano saraceno', 65, 52],
      ['Riso venere', 65, 52],
      ['Pasta di timilia', 70, 55],
      ["Pasta d'avena", 70, 55],
      ['Pane tostato', 85, 68],
      ['Patate dolci americane', 250, 200],
    ],
    proteine: [
      ['Tonno al naturale sgocciolato', 120, 120],
      ['Salmone', 150, 150],
      ['Pesce persico o altro pesce magro', 150, 150],
      ['Roast beef magro', 130, 130],
      ['Hamburger bovino magro', 140, 140],
      ['Petto di tacchino', 135, 135],
      ['Petto di pollo', 135, 135],
      ['Seppie o calamari', 200, 200],
      ['Feta light + albume', 50, 50],
      ['Ricotta di pecora + albume', 70, 70],
      ['Prosciutto crudo sgrassato + albume', 50, 50],
    ],
  },
  spuntino: {
    fruttaGrassi: fixed(
      150,
      'Frutta fresca + nocciole',
      'Frutta fresca + noci',
      'Frutta fresca + cioccolato fondente 85%',
      'Frutta fresca + olive',
      'Frutta fresca + parmigiano 36 mesi',
    ),
    alternativePome: fixed(100, 'Yogurt greco/skyr + mandarini', 'Yogurt greco + castagne al vapore', 'Gallette + yogurt + marmellata Hero'),
  },
  cena: {
    verdura: fixed(200, 'Broccoli o cime di rapa', 'Valeriana', 'Radicchio rosso', 'Zucchine', 'Finocchi', 'Fagiolini', 'Carote', 'Bieta o bietole'),
    carboidrati: [
      ['Riso basmati', 50, 30],
      ['Patate', 220, 140],
      ['Piadina integrale', 60, 40],
      ['Pasta grano saraceno', 50, 30],
      ['Gallette grano saraceno', 50, 30],
      ['Grano saraceno', 50, 30],
      ['Riso venere', 50, 30],
      ['Pasta di timilia', 50, 30],
      ["Pasta d'avena", 50, 30],
      ['Pane tostato', 60, 40],
      ['Patate dolci', 200, 130],
    ],
    proteine: [
      ...fixed(260, 'Petto di pollo', 'Petto di tacchino'),
      ...fixed(280, 'Merluzzo', 'Pesce persico', 'Altro pesce magro'),
      ...fixed(250, 'Vitello magro', 'Roast beef magro', 'Seppie o calamari'),
    ],
  },
}
