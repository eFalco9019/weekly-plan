// Rotazione degli alimenti tra i giorni: ogni categoria di ogni pasto
// scorre la propria tabella di equivalenza in base alla data, così due
// giorni consecutivi non hanno mai la stessa scelta nella stessa
// categoria. Le grammature restano quelle della tabella (equivalenti per
// CHO), quindi i totali del giorno non cambiano.

function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** Giorni trascorsi dal 1/1/1970 per una data ISO (YYYY-MM-DD), senza fusi orari. */
export function dayNumber(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/**
 * Indice dell'alimento da proporre per una categoria in una data.
 * - passo diverso per categoria (coprimo con il numero di alimenti), così
 *   le combinazioni tra categorie non si ripetono a blocchi;
 * - `seed` sposta tutta la settimana su un'altra combinazione (pulsante
 *   "Varia il menu" della vista settimanale). Con lo stesso seed,
 *   due giorni consecutivi restano sempre diversi.
 */
export function rotationIndex(date: string, key: string, n: number, seed = 0): number {
  return rotationIndexAt(dayNumber(date), key, n, seed)
}

/** Come rotationIndex, ma con il giorno già espresso come numero (dayNumber). */
export function rotationIndexAt(day: number, key: string, n: number, seed = 0): number {
  if (n <= 1) return 0
  const h = hash(key)
  const candidates = [1, 2, 3, 4, 5].filter((s) => s % n !== 0 && gcd(s, n) === 1)
  const stride = candidates[h % candidates.length] ?? 1
  const offset = h % n
  const raw = (day + seed) * stride + offset
  return ((raw % n) + n) % n
}

/** Nome normalizzato per riconoscere lo stesso alimento in tabelle diverse
 * (es. "Patate dolci americane" a pranzo e "Patate dolci" a cena). */
function sameFoodKey(alimento: string): string {
  return alimento.toLowerCase().replace(/\s+americane\b/, '').replace(/\s*\(.*?\)/g, '').trim()
}

/** Le alternative contenute in un nome tipo "Pesce persico o altro pesce
 * magro" / "Bieta o bietole": due alimenti sono "lo stesso" se ne
 * condividono almeno una. */
export function foodAlternatives(alimento: string): string[] {
  return sameFoodKey(alimento)
    .split(/\s+o\s+/)
    .map((a) => a.trim())
    .filter(Boolean)
}
