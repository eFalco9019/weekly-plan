import type { MealTemplate } from '../types'
import { coefficientsFor, templatesFromCoefficients } from './coefficients'
import { buildFoodEquivalents, type RawFood } from '../lib/foodEquivalents'

// Dati raccolti da Ezio per il profilo "arianna" (Ary), Settimana 1.
// Target colazione dato come range "~45-50 / ~30-35": usiamo il punto
// medio (47.5 / 32.5) come target di riferimento per il motore di
// compensazione.

// Target dei pasti calcolati dai coefficienti del piano (src/data/coefficients.ts):
// coincidono con i target scritti in origine entro 0,5 g di carboidrati.
export const week1Templates: MealTemplate[] = templatesFromCoefficients(coefficientsFor('arianna')!, 1)

const colazioneCarbo: RawFood[] = [
  { alimento: 'Pane tostato', categoria: 'carboidrati', grammiOn: 85, grammiOff: 60 },
  { alimento: 'Biscotti senza zuccheri aggiunti', categoria: 'carboidrati', grammiOn: 60, grammiOff: 40 },
  { alimento: 'Muesli', categoria: 'carboidrati', grammiOn: 65, grammiOff: 45 },
  { alimento: 'Farina di riso', categoria: 'carboidrati', grammiOn: 55, grammiOff: 38 },
  { alimento: 'Gallette grano saraceno', categoria: 'carboidrati', grammiOn: 60, grammiOff: 40 },
  { alimento: "Granola d'avena", categoria: 'carboidrati', grammiOn: 65, grammiOff: 45 },
  { alimento: 'Gallette di riso', categoria: 'carboidrati', grammiOn: 55, grammiOff: 38 },
  { alimento: "Farina d'avena", categoria: 'carboidrati', grammiOn: 65, grammiOff: 45 },
  { alimento: 'Fiocchi di riso', categoria: 'carboidrati', grammiOn: 55, grammiOff: 38 },
  { alimento: "Fiocchi d'avena", categoria: 'carboidrati', grammiOn: 65, grammiOff: 45 },
]

const colazioneProteine: RawFood[] = [
  { alimento: 'Yogurt greco 0%', categoria: 'proteine', grammiOn: 250, grammiOff: 250 },
  { alimento: 'Proteine whey isolate 90%', categoria: 'proteine', grammiOn: 28, grammiOff: 28 },
  { alimento: 'Philadelphia Active (~11g prot/100g)', categoria: 'proteine', grammiOn: 220, grammiOff: 220 },
  { alimento: 'Albume', categoria: 'proteine', grammiOn: 230, grammiOff: 230 },
  { alimento: '1 uovo intero + albume', categoria: 'proteine', grammiOn: 180, grammiOff: 180, note: '1 uovo intero + 180g albume' },
]

const colazioneGrassi: RawFood[] = [
  { alimento: 'Cocco grattugiato', categoria: 'grassi', grammiOn: 10, grammiOff: 10 },
  { alimento: 'Cioccolato fondente 85%', categoria: 'grassi', grammiOn: 15, grammiOff: 15 },
  { alimento: 'Burro ghee', categoria: 'grassi', grammiOn: 10, grammiOff: 10 },
  { alimento: 'Burro 100% frutta secca', categoria: 'grassi', grammiOn: 15, grammiOff: 15 },
  { alimento: 'Noci o nocciole', categoria: 'grassi', grammiOn: 15, grammiOff: 15 },
]

const colazioneFrutta: RawFood[] = [
  { alimento: 'Frutta fresca', categoria: 'frutta', grammiOn: 40, grammiOff: 40 },
  { alimento: 'Marmellata Hero Light', categoria: 'frutta', grammiOn: 30, grammiOff: 30 },
]

const pranzoVerdura: RawFood[] = [
  'Zucca gialla', 'Broccoli o cime di rapa', 'Valeriana', 'Radicchio rosso',
  'Zucchine', 'Finocchi', 'Fagiolini', 'Carote', 'Bieta',
].map((alimento) => ({ alimento, categoria: 'verdura' as const, grammiOn: 200, grammiOff: 200 }))

const pranzoCarbo: RawFood[] = [
  { alimento: 'Riso basmati', categoria: 'carboidrati', grammiOn: 65, grammiOff: 52 },
  { alimento: 'Patate', categoria: 'carboidrati', grammiOn: 300, grammiOff: 240 },
  { alimento: 'Piadina integrale', categoria: 'carboidrati', grammiOn: 75, grammiOff: 60 },
  { alimento: 'Pasta grano saraceno', categoria: 'carboidrati', grammiOn: 70, grammiOff: 55 },
  { alimento: 'Gallette grano saraceno', categoria: 'carboidrati', grammiOn: 65, grammiOff: 52 },
  { alimento: 'Grano saraceno', categoria: 'carboidrati', grammiOn: 65, grammiOff: 52 },
  { alimento: 'Riso venere', categoria: 'carboidrati', grammiOn: 65, grammiOff: 52 },
  { alimento: 'Pasta di timilia', categoria: 'carboidrati', grammiOn: 70, grammiOff: 55 },
  { alimento: "Pasta d'avena", categoria: 'carboidrati', grammiOn: 70, grammiOff: 55 },
  { alimento: 'Pane tostato', categoria: 'carboidrati', grammiOn: 85, grammiOff: 68 },
  { alimento: 'Patate dolci americane', categoria: 'carboidrati', grammiOn: 250, grammiOff: 200 },
]

const pranzoProteine: RawFood[] = [
  { alimento: 'Tonno al naturale sgocciolato', categoria: 'proteine', grammiOn: 120, grammiOff: 120, note: 'grassi: 14g olio EVO' },
  { alimento: 'Salmone', categoria: 'proteine', grammiOn: 150, grammiOff: 150, note: 'grassi: niente olio aggiunto' },
  { alimento: 'Pesce persico o altro pesce magro', categoria: 'proteine', grammiOn: 150, grammiOff: 150, note: 'grassi: 12g olio EVO' },
  { alimento: 'Roast beef magro', categoria: 'proteine', grammiOn: 130, grammiOff: 130, note: 'grassi: 10g olio EVO' },
  { alimento: 'Hamburger bovino magro', categoria: 'proteine', grammiOn: 140, grammiOff: 140, note: 'grassi: regolare olio' },
  { alimento: 'Petto di tacchino', categoria: 'proteine', grammiOn: 135, grammiOff: 135, note: 'grassi: 12g olio EVO' },
  { alimento: 'Petto di pollo', categoria: 'proteine', grammiOn: 135, grammiOff: 135, note: 'grassi: 12g olio EVO' },
  { alimento: 'Seppie o calamari', categoria: 'proteine', grammiOn: 200, grammiOff: 200 },
  { alimento: 'Feta light + albume', categoria: 'proteine', grammiOn: 50, grammiOff: 50, note: '50g feta light + 200g albume' },
  { alimento: 'Ricotta di pecora + albume', categoria: 'proteine', grammiOn: 70, grammiOff: 70, note: '70g ricotta + 220g albume' },
  { alimento: 'Prosciutto crudo sgrassato + albume', categoria: 'proteine', grammiOn: 50, grammiOff: 50, note: '50g prosciutto + 130g albume' },
]

const cenaVerdura: RawFood[] = [
  'Broccoli o cime di rapa', 'Valeriana', 'Radicchio rosso', 'Zucchine',
  'Finocchi', 'Fagiolini', 'Carote', 'Bieta o bietole',
].map((alimento) => ({ alimento, categoria: 'verdura' as const, grammiOn: 200, grammiOff: 200 }))

const cenaCarbo: RawFood[] = [
  { alimento: 'Riso basmati', categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: 'Patate', categoria: 'carboidrati', grammiOn: 220, grammiOff: 140 },
  { alimento: 'Piadina integrale', categoria: 'carboidrati', grammiOn: 60, grammiOff: 40 },
  { alimento: 'Pasta grano saraceno', categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: 'Gallette grano saraceno', categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: 'Grano saraceno', categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: 'Riso venere', categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: 'Pasta di timilia', categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: "Pasta d'avena", categoria: 'carboidrati', grammiOn: 50, grammiOff: 30 },
  { alimento: 'Pane tostato', categoria: 'carboidrati', grammiOn: 60, grammiOff: 40 },
  { alimento: 'Patate dolci', categoria: 'carboidrati', grammiOn: 200, grammiOff: 130 },
]

const cenaProteine: RawFood[] = [
  { alimento: 'Petto di pollo', categoria: 'proteine', grammiOn: 260, grammiOff: 260, note: 'grassi: 10g olio EVO' },
  { alimento: 'Petto di tacchino', categoria: 'proteine', grammiOn: 260, grammiOff: 260, note: 'grassi: 10g olio EVO' },
  { alimento: 'Merluzzo', categoria: 'proteine', grammiOn: 280, grammiOff: 280 },
  { alimento: 'Pesce persico', categoria: 'proteine', grammiOn: 280, grammiOff: 280 },
  { alimento: 'Altro pesce magro', categoria: 'proteine', grammiOn: 280, grammiOff: 280 },
  { alimento: 'Vitello magro', categoria: 'proteine', grammiOn: 250, grammiOff: 250 },
  { alimento: 'Roast beef magro', categoria: 'proteine', grammiOn: 250, grammiOff: 250 },
  { alimento: 'Seppie o calamari', categoria: 'proteine', grammiOn: 250, grammiOff: 250 },
]

const spuntinoFruttaGrassi: RawFood[] = [
  { alimento: 'Frutta fresca + nocciole', categoria: 'frutta', grammiOn: 150, grammiOff: 150, note: '150g frutta + 10g nocciole' },
  { alimento: 'Frutta fresca + noci', categoria: 'frutta', grammiOn: 150, grammiOff: 150, note: '150g frutta + 10g noci' },
  { alimento: 'Frutta fresca + cioccolato fondente 85%', categoria: 'frutta', grammiOn: 150, grammiOff: 150, note: '150g frutta + 10g cioccolato' },
  { alimento: 'Frutta fresca + olive', categoria: 'frutta', grammiOn: 150, grammiOff: 150, note: '150g frutta + 30g olive' },
  { alimento: 'Frutta fresca + parmigiano 36 mesi', categoria: 'frutta', grammiOn: 150, grammiOff: 150, note: '150g frutta + 20g parmigiano' },
]

const spuntinoAlternativePome: RawFood[] = [
  { alimento: 'Yogurt greco/skyr + mandarini', categoria: 'proteine', grammiOn: 100, grammiOff: 100, note: '100g yogurt/skyr + 2 mandarini' },
  { alimento: 'Yogurt greco + castagne al vapore', categoria: 'proteine', grammiOn: 100, grammiOff: 100, note: '100g yogurt + 30g castagne' },
  { alimento: 'Gallette + yogurt + marmellata Hero', categoria: 'proteine', grammiOn: 100, grammiOff: 100, note: '2 gallette + 100g yogurt + 30g marmellata' },
]

export const week1Colazione = {
  carboidrati: buildFoodEquivalents('colazione', week1Templates[0], colazioneCarbo),
  proteine: buildFoodEquivalents('colazione', week1Templates[0], colazioneProteine),
  grassi: buildFoodEquivalents('colazione', week1Templates[0], colazioneGrassi),
  frutta: buildFoodEquivalents('colazione', week1Templates[0], colazioneFrutta),
}

export const week1Pranzo = {
  verdura: buildFoodEquivalents('pranzo', week1Templates[1], pranzoVerdura),
  carboidrati: buildFoodEquivalents('pranzo', week1Templates[1], pranzoCarbo),
  proteine: buildFoodEquivalents('pranzo', week1Templates[1], pranzoProteine),
}

export const week1Cena = {
  verdura: buildFoodEquivalents('cena', week1Templates[2], cenaVerdura),
  carboidrati: buildFoodEquivalents('cena', week1Templates[2], cenaCarbo),
  proteine: buildFoodEquivalents('cena', week1Templates[2], cenaProteine),
}

export const week1Spuntino = {
  fruttaGrassi: buildFoodEquivalents('spuntino', week1Templates[3], spuntinoFruttaGrassi),
  alternativePome: buildFoodEquivalents('spuntino', week1Templates[3], spuntinoAlternativePome),
}
