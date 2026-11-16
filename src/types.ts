// Modello dati condiviso della plancia nutrizionale.
// I giorni del piano si sincronizzano con la tabella day_plans (supabase/migrations).

export type ProfileId = 'ezio' | 'arianna'

export interface Profile {
  id: ProfileId
  nome: string
  pesoKg: number
  altezzaCm: number
  proteineGFisse: number
  grassiGFissi: number
}

export type DayType = 'ON' | 'OFF'

export type MealType = 'colazione' | 'pranzo' | 'spuntino' | 'cena'

export type FoodCategory = 'carboidrati' | 'proteine' | 'grassi' | 'frutta' | 'verdura'

/**
 * Una voce di una tabella di equivalenza: lo stesso pasto può essere
 * composto scegliendo UNA fonte per categoria. Ogni fonte ha una
 * grammatura diversa nei giorni ON rispetto ai giorni OFF, perché il
 * target di CHO cambia.
 */
export interface FoodEquivalent {
  meal: MealType
  categoria: FoodCategory
  alimento: string
  grammiOn: number
  grammiOff: number
  /** g di CHO per 100 g di alimento. Necessario solo per la categoria
   * 'carboidrati' (è quella su cui agisce il motore di compensazione);
   * per le altre categorie può essere 0/omesso. */
  choPer100g?: number
  note?: string
}

/** Target macro di un pasto, per una data settimana del piano. */
export interface MealTemplate {
  week: number
  meal: MealType
  targetChoOnG: number
  targetChoOffG: number
  targetProteinG?: number
  targetFatG?: number
}

/** Progressione settimanale dei carboidrati totali giornalieri (per profilo). */
export interface ChoProgressionWeek {
  profile: ProfileId
  week: number
  onChoG: number
  offChoG: number
  onKcal?: number
  offKcal?: number
}

/** Stato ON/OFF di una data specifica per un profilo (non legato al giorno della settimana). */
export interface DayLog {
  profile: ProfileId
  date: string // YYYY-MM-DD
  dayType: DayType
  week: number
}

/** La scelta effettiva (alimento + grammatura) di un profilo per un pasto in una data. */
export interface DayMealChoice {
  profile: ProfileId
  date: string
  meal: MealType
  categoria: FoodCategory
  alimento: string
  grammi: number
  /** Se true, il motore di compensazione non tocca questo pasto quando si
   * ribilanciano gli altri pasti della giornata. */
  bloccato?: boolean
}

// ---------------------------------------------------------------------
// Libreria ricette
// ---------------------------------------------------------------------

/** Un ingrediente di una ricetta, con la grammatura "base" (per le
 * porzioni indicate in baseServings) e, se nota, la densità di CHO per
 * 100g — necessaria per poter scalare la ricetta sul target del pasto. */
export interface RecipeIngredient {
  nome: string
  grammiBase: number
  choPer100g?: number
  /** true se questo è l'ingrediente "principale" da scalare per
   * adattare la ricetta al target di CHO del pasto (es. la pasta). Gli
   * altri ingredienti restano fissi o scalano in proporzione minore. */
  scalabile?: boolean
}

export interface Recipe {
  id: string
  nome: string
  /** Pasto consigliato per questa ricetta (una pasta è pensata per il
   * pranzo, non per la cena, per esempio). */
  pastoConsigliato: MealType
  porzioniBase: number
  ingredienti: RecipeIngredient[]
  preparazione?: string
  /** Link al post Instagram/social da cui proviene, se noto. Claude non
   * può leggere il contenuto del link automaticamente: serve sempre che
   * l'utente fornisca anche il testo/screenshot della ricetta. */
  fonteUrl?: string
  fonteNote?: string
}

/** Assegnazione di una ricetta della libreria a un pasto di una data
 * specifica, con le porzioni effettive (da cui si derivano le
 * grammature scalate). */
export interface DayRecipeAssignment {
  profile: ProfileId
  date: string
  meal: MealType
  recipeId: string
  porzioni: number
}
