// Modello dati della plancia nutrizionale. I giorni si sincronizzano con la
// tabella days (supabase/migrations), il piano dell'utente con profiles.

export type DayType = 'ON' | 'OFF'

export type MealType = 'colazione' | 'pranzo' | 'spuntino' | 'cena'

/** Un alimento di una tabella di equivalenza, con i grammi del giorno ON e OFF. */
export interface FoodEquivalent {
  alimento: string
  grammiOn: number
  grammiOff: number
  /** g di CHO per 100 g: solo per la categoria 'carboidrati' (usata dalla compensazione). */
  choPer100g?: number
}

/** Target macro di un pasto, per una data settimana del piano. */
export interface MealTemplate {
  week: number
  meal: MealType
  targetChoOnG: number
  targetChoOffG: number
  /** Carboidrati del pasto che il piano dà per fissi (porzioni da tabella,
   * non regolate dal motore): oggi lo spuntino. Contano nel totale del giorno. */
  choFissoG?: number
  targetProteinG?: number
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
