// Utility per lavorare con date in formato ISO (YYYY-MM-DD) e settimane
// Lun-Dom (convenzione italiana), usate dalla vista settimanale.

export function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

/** Data locale in formato YYYY-MM-DD. Non usa toISOString(), che converte
 * in UTC: in Italia (UTC+1/+2) la mezzanotte locale diventa il giorno
 * prima e ogni addDays perdeva un giorno. */
export function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

/** Lunedì della settimana (Lun-Dom) che contiene la data data. */
export function mondayOf(iso: string): string {
  const d = parseIso(iso)
  const weekday = d.getDay() // 0 = domenica, 1 = lunedì, ... 6 = sabato
  const diff = weekday === 0 ? -6 : 1 - weekday
  return addDays(iso, diff)
}

/** Le 7 date (Lun-Dom) della settimana calendario che contiene anchorIso. */
export function weekDates(anchorIso: string): string[] {
  const monday = mondayOf(anchorIso)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export function shiftWeek(iso: string, deltaWeeks: number): string {
  return addDays(iso, deltaWeeks * 7)
}

export function formatDayMonth(iso: string): string {
  const d = parseIso(iso)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
