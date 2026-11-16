// Numeri all'italiana: virgola decimale, niente decimali inutili.

const g1 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 })
const g0 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 })

/** Grammi arrotondati all'intero: "138". */
export function fmtInt(n: number): string {
  return g0.format(Math.round(n))
}

/** Valore con al massimo un decimale: "137,5". */
export function fmt1(n: number): string {
  return g1.format(Math.round(n * 10) / 10)
}

/** Quantità per la spesa: grammi sotto il chilo, poi chili con un decimale. */
export function fmtWeight(grams: number): string {
  if (grams >= 1000) return `${g1.format(Math.round(grams / 100) / 10)} kg`
  return `${g0.format(Math.round(grams))} g`
}

const weekdayLong = new Intl.DateTimeFormat('it-IT', { weekday: 'long' })
const dayMonthLong = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' })

function parse(iso: string) {
  return new Date(`${iso}T00:00:00`)
}

/** "Lunedì" */
export function weekdayName(iso: string): string {
  const s = weekdayLong.format(parse(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "16 novembre" */
export function dayMonthName(iso: string): string {
  return dayMonthLong.format(parse(iso))
}

const monthLong = new Intl.DateTimeFormat('it-IT', { month: 'long' })

/** "16–22 novembre", oppure "28 novembre – 4 dicembre" a cavallo di due mesi. */
export function rangeName(fromIso: string, toIso: string): string {
  const a = parse(fromIso)
  const b = parse(toIso)
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${monthLong.format(b)}`
  return `${dayMonthName(fromIso)} – ${dayMonthName(toIso)}`
}
