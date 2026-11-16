import type { DayState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { mealOrder as meals, mealLabels, mealIcons, mealColor } from '../lib/meals'
import { calcDayChoTotals, calcMealChoBreakdown } from '../hooks/useDayPlan'
import { splitFixedMacroByMeal } from '../lib/macroBreakdown'
import { SegmentedRing, type RingSegment } from './SegmentedRing'

interface Props {
  state: DayState
  templates: MealTemplate[]
  dayType: DayType
  week: number
  proteinG?: number
  fatG?: number
}

function fmt(n: number) {
  return Math.round(n)
}

export function DayTotals({ state, templates, dayType, week, proteinG = 0, fatG = 0 }: Props) {
  const { actual, target } = calcDayChoTotals(week, dayType, state, templates)
  const diff = Math.round((actual - target) * 10) / 10
  const label = dayType === 'ON' ? 'Giorno energia' : 'Giorno recupero'

  const cho = calcMealChoBreakdown(week, dayType, state, templates)
  const protein = splitFixedMacroByMeal(proteinG, templates, 'targetProteinG')
  const fat = splitFixedMacroByMeal(fatG, templates, 'targetFatG')

  const choByMeal = (m: MealType) => cho.find((c) => c.meal === m)?.actual ?? 0
  const proteinByMeal = (m: MealType) => protein.find((p) => p.meal === m)?.targetG ?? 0
  const fatByMeal = (m: MealType) => fat.find((p) => p.meal === m)?.targetG ?? 0

  // Proteine/grassi: il piano dà un valore esplicito solo per alcuni pasti
  // (oggi il pranzo); per gli altri è una stima — li marchiamo con "≈".
  const isEstimate = (m: MealType, key: 'targetProteinG' | 'targetFatG') =>
    templates.find((t) => t.meal === m)?.[key] === undefined

  const segments = (valueOf: (m: MealType) => number): RingSegment[] =>
    meals.map((m) => ({ key: m, value: valueOf(m), color: mealColor(m), icon: mealIcons[m] }))

  const hasProtein = proteinG > 0
  const hasFat = fatG > 0

  return (
    <section className={`day-totals day-totals--${dayType.toLowerCase()}`}>
      <div className="day-totals__head">
        <span className="day-totals__label">{label}</span>
        <span className="day-totals__sub">
          Carboidrati{' '}
          {diff === 0 ? 'in linea con il target' : diff > 0 ? `${diff} g sopra il target` : `${Math.abs(diff)} g sotto il target`}
        </span>
      </div>

      <div className="day-totals__rings">
        <figure className="day-totals__ring">
          <SegmentedRing segments={segments(choByMeal)} total={target} label={`Carboidrati ${fmt(actual)} su ${fmt(target)} grammi`}>
            <strong className="day-totals__value">{fmt(actual)}</strong>
            <span className="day-totals__unit">/ {fmt(target)} g</span>
          </SegmentedRing>
          <figcaption>Carboidrati</figcaption>
        </figure>

        <figure className="day-totals__ring">
          <SegmentedRing segments={segments(proteinByMeal)} total={proteinG} label={`Proteine ${proteinG} grammi`}>
            <strong className="day-totals__value">{hasProtein ? proteinG : '—'}</strong>
            <span className="day-totals__unit">{hasProtein ? 'g' : 'da inserire'}</span>
          </SegmentedRing>
          <figcaption>Proteine</figcaption>
        </figure>

        <figure className="day-totals__ring">
          <SegmentedRing segments={segments(fatByMeal)} total={fatG} label={`Grassi ${fatG} grammi`}>
            <strong className="day-totals__value">{hasFat ? fatG : '—'}</strong>
            <span className="day-totals__unit">{hasFat ? 'g' : 'da inserire'}</span>
          </SegmentedRing>
          <figcaption>Grassi</figcaption>
        </figure>
      </div>

      <table className="day-totals__table">
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Pasto</span>
            </th>
            <th scope="col">Carbo</th>
            <th scope="col">Proteine</th>
            <th scope="col">Grassi</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((m) => (
            <tr key={m}>
              <th scope="row">
                <i className="day-totals__dot" style={{ background: mealColor(m) }} />
                {mealLabels[m]}
              </th>
              <td>{fmt(choByMeal(m))} g</td>
              <td>
                {hasProtein ? (
                  <>
                    {isEstimate(m, 'targetProteinG') && '≈ '}
                    {fmt(proteinByMeal(m))} g
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td>
                {hasFat ? (
                  <>
                    {isEstimate(m, 'targetFatG') && '≈ '}
                    {fmt(fatByMeal(m))} g
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasFat && (
        <p className="day-totals__note">
          Proteine per pasto: quote ricavate dalle porzioni del piano. ≈ grassi stimati: il piano li indica solo per il
          pranzo, gli altri pasti si dividono il resto del totale giornaliero.
        </p>
      )}
    </section>
  )
}
