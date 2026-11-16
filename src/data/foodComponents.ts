import type { MealType } from '../types'

/**
 * Alimenti delle tabelle di equivalenza che nel piano sono in realtà più
 * ingredienti: "1 uovo intero + albume", gli spuntini "frutta + nocciole",
 * e le proteine di pranzo/cena con la dose di olio EVO indicata nelle note
 * del piano. Le dosi sono quelle del piano alla grammatura di riferimento
 * (`ref`, la grammatura scritta in tabella); se la grammatura scelta è
 * diversa i componenti scalano in proporzione.
 */
interface Composite {
  ref: number
  componenti: { nome: string; grammi: number }[]
}

const any: Record<string, Composite> = {
  '1 uovo intero + albume': { ref: 180, componenti: [{ nome: 'Uovo intero', grammi: 50 }, { nome: 'Albume', grammi: 180 }] },
  'Feta light + albume': { ref: 50, componenti: [{ nome: 'Feta light', grammi: 50 }, { nome: 'Albume', grammi: 200 }] },
  'Ricotta di pecora + albume': { ref: 70, componenti: [{ nome: 'Ricotta di pecora', grammi: 70 }, { nome: 'Albume', grammi: 220 }] },
  'Prosciutto crudo sgrassato + albume': { ref: 50, componenti: [{ nome: 'Prosciutto crudo sgrassato', grammi: 50 }, { nome: 'Albume', grammi: 130 }] },
  'Frutta fresca + nocciole': { ref: 150, componenti: [{ nome: 'Frutta fresca', grammi: 150 }, { nome: 'Nocciole', grammi: 10 }] },
  'Frutta fresca + noci': { ref: 150, componenti: [{ nome: 'Frutta fresca', grammi: 150 }, { nome: 'Noci', grammi: 10 }] },
  'Frutta fresca + cioccolato fondente 85%': { ref: 150, componenti: [{ nome: 'Frutta fresca', grammi: 150 }, { nome: 'Cioccolato fondente 85%', grammi: 10 }] },
  'Frutta fresca + olive': { ref: 150, componenti: [{ nome: 'Frutta fresca', grammi: 150 }, { nome: 'Olive', grammi: 30 }] },
  'Frutta fresca + parmigiano 36 mesi': { ref: 150, componenti: [{ nome: 'Frutta fresca', grammi: 150 }, { nome: 'Parmigiano 36 mesi', grammi: 20 }] },
  'Yogurt greco/skyr + mandarini': { ref: 100, componenti: [{ nome: 'Yogurt greco 0%', grammi: 100 }, { nome: 'Mandarini', grammi: 140 }] },
  'Yogurt greco + castagne al vapore': { ref: 100, componenti: [{ nome: 'Yogurt greco 0%', grammi: 100 }, { nome: 'Castagne cotte', grammi: 30 }] },
  'Gallette + yogurt + marmellata Hero': { ref: 100, componenti: [{ nome: 'Gallette di riso', grammi: 16 }, { nome: 'Yogurt greco 0%', grammi: 100 }, { nome: 'Marmellata Hero Light', grammi: 30 }] },
}

/** Olio EVO che il piano abbina a una proteina, per pasto (note "grassi: Xg olio EVO"),
 * alla grammatura di riferimento della proteina: scala con la porzione. */
const olioPerPasto: Partial<Record<MealType, Record<string, { olio: number; ref: number }>>> = {
  pranzo: {
    'Tonno al naturale sgocciolato': { olio: 14, ref: 120 },
    'Pesce persico o altro pesce magro': { olio: 12, ref: 150 },
    'Roast beef magro': { olio: 10, ref: 130 },
    'Petto di tacchino': { olio: 12, ref: 135 },
    'Petto di pollo': { olio: 12, ref: 135 },
  },
  cena: {
    'Petto di pollo': { olio: 10, ref: 260 },
    'Petto di tacchino': { olio: 10, ref: 260 },
  },
}

/** Ingredienti effettivi di una scelta da tabella (un solo elemento se non è composta). */
export function foodComponents(meal: MealType, alimento: string, grammi: number): { nome: string; grammi: number }[] {
  const composite = any[alimento]
  const base = composite
    ? composite.componenti.map((c) => ({ nome: c.nome, grammi: Math.round((c.grammi * grammi) / composite.ref) }))
    : [{ nome: alimento, grammi }]
  const olio = olioPerPasto[meal]?.[alimento]
  return olio ? [...base, { nome: 'Olio EVO', grammi: Math.round((olio.olio * grammi) / olio.ref) }] : base
}
