/**
 * Archivio ingredienti: macro per 100 g di prodotto (crudo/secco salvo
 * indicazione). Valori INDICATIVI, arrotondati, da tabelle nutrizionali
 * standard (CREA / USDA) — da verificare con etichette o dietista.
 *
 * `contaCho`: i carboidrati di quell'ingrediente contano sul target CHO
 * del pasto. Segue la logica del piano: contano le fonti amidacee
 * (pasta, riso, pane, patate, legumi, castagne…); verdure, frutta,
 * latticini e condimenti non sono conteggiati nei target di CHO.
 */
export type IngredientCategory = 'carboidrati' | 'proteine' | 'grassi' | 'frutta' | 'verdura' | 'aromi'

export interface IngredientInfo {
  cho: number
  prot: number
  fat: number
  contaCho?: boolean
  /** Reparto, usato anche per raggruppare la lista della spesa. */
  cat: IngredientCategory
}

const db: Record<string, IngredientInfo> = {
  // Fonti di carboidrati
  'pasta di semola': { cho: 75, prot: 12, fat: 1.5, contaCho: true, cat: 'carboidrati' },
  "fiocchi d'avena": { cho: 60, prot: 13, fat: 7, contaCho: true, cat: 'carboidrati' },
  "farina d'avena": { cho: 60, prot: 13, fat: 7, contaCho: true, cat: 'carboidrati' },
  "granola d'avena": { cho: 62, prot: 9, fat: 14, contaCho: true, cat: 'carboidrati' },
  'gallette di riso': { cho: 80, prot: 8, fat: 3, contaCho: true, cat: 'carboidrati' },
  'pane tostato': { cho: 70, prot: 11, fat: 6, contaCho: true, cat: 'carboidrati' },
  'riso basmati': { cho: 78, prot: 7.5, fat: 0.6, contaCho: true, cat: 'carboidrati' },
  'riso venere': { cho: 72, prot: 7.5, fat: 2.5, contaCho: true, cat: 'carboidrati' },
  'piadina integrale': { cho: 50, prot: 9, fat: 10, contaCho: true, cat: 'carboidrati' },
  patate: { cho: 17, prot: 2, fat: 0.1, contaCho: true, cat: 'carboidrati' },
  'patate dolci': { cho: 20, prot: 1.6, fat: 0.1, contaCho: true, cat: 'carboidrati' },
  ceci: { cho: 18, prot: 8, fat: 2.5, contaCho: true, cat: 'carboidrati' }, // lessati / in scatola sgocciolati
  piselli: { cho: 9, prot: 5.5, fat: 0.4, contaCho: true, cat: 'carboidrati' },
  'castagne cotte': { cho: 28, prot: 2, fat: 1.4, contaCho: true, cat: 'carboidrati' },

  // Proteine
  bresaola: { cho: 0.4, prot: 32, fat: 2.6, cat: 'proteine' },
  ricotta: { cho: 3.5, prot: 8.8, fat: 10.9, cat: 'proteine' },
  salmone: { cho: 0, prot: 20, fat: 13, cat: 'proteine' },
  merluzzo: { cho: 0, prot: 17, fat: 0.3, cat: 'proteine' },
  'petto di pollo': { cho: 0, prot: 23, fat: 1.5, cat: 'proteine' },
  'petto di tacchino': { cho: 0, prot: 24, fat: 1, cat: 'proteine' },
  seppie: { cho: 0.7, prot: 14, fat: 1.5, cat: 'proteine' },
  'vitello magro': { cho: 0, prot: 21, fat: 3, cat: 'proteine' },
  albume: { cho: 0.7, prot: 11, fat: 0.2, cat: 'proteine' },
  'uovo intero': { cho: 0.7, prot: 12.5, fat: 10, cat: 'proteine' },
  'yogurt greco 0%': { cho: 4, prot: 10, fat: 0, cat: 'proteine' },

  // Grassi
  noci: { cho: 5, prot: 14.3, fat: 68, cat: 'grassi' },
  'cocco grattugiato': { cho: 6, prot: 6, fat: 62, cat: 'grassi' },
  'cioccolato fondente 85%': { cho: 19, prot: 10, fat: 50, cat: 'grassi' },
  'burro 100% frutta secca': { cho: 10, prot: 22, fat: 52, cat: 'grassi' },
  'olio evo': { cho: 0, prot: 0, fat: 100, cat: 'grassi' },

  // Frutta
  'frutta fresca': { cho: 10, prot: 0.5, fat: 0.2, cat: 'frutta' },
  'marmellata hero light': { cho: 30, prot: 0.3, fat: 0.1, cat: 'frutta' },

  // Verdure
  radicchio: { cho: 1.6, prot: 1.4, fat: 0.1, cat: 'verdura' },
  zucca: { cho: 3.5, prot: 1.1, fat: 0.1, cat: 'verdura' },
  funghi: { cho: 0.8, prot: 3, fat: 0.3, cat: 'verdura' },
  spinaci: { cho: 1.4, prot: 2.9, fat: 0.4, cat: 'verdura' },
  zucchine: { cho: 1.4, prot: 1.3, fat: 0.1, cat: 'verdura' },
  broccoli: { cho: 3, prot: 3, fat: 0.4, cat: 'verdura' },
  fagiolini: { cho: 2.4, prot: 2, fat: 0.1, cat: 'verdura' },
  valeriana: { cho: 0.7, prot: 2, fat: 0.4, cat: 'verdura' },
  'passata di pomodoro': { cho: 3, prot: 1.3, fat: 0.2, cat: 'verdura' },

  // Erbe, spezie, aromi (quantità trascurabili)
  'erbe e spezie': { cho: 0, prot: 0, fat: 0, cat: 'aromi' },
}

/** Nomi usati nelle ricette che corrispondono a una voce dell'archivio. */
const aliases: Record<string, string> = {
  paccheri: 'pasta di semola',
  ditali: 'pasta di semola',
  trofie: 'pasta di semola',
  conchiglie: 'pasta di semola',
  fusilli: 'pasta di semola',
  'radicchio rosso': 'radicchio',
  'zucca gialla': 'zucca',
  'noci o nocciole': 'noci',
  'seppie o calamari': 'seppie',
  'broccoli o cime di rapa': 'broccoli',
  'salvia e rosmarino': 'erbe e spezie',
  salvia: 'erbe e spezie',
  prezzemolo: 'erbe e spezie',
  'scorza di limone': 'erbe e spezie',
  cannella: 'erbe e spezie',
  curry: 'erbe e spezie',
}

export function ingredientInfo(nome: string): IngredientInfo | undefined {
  const key = nome.trim().toLowerCase()
  return db[key] ?? db[aliases[key] ?? '']
}
