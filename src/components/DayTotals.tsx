import type { DayState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { mealOrder as meals, mealLabels, mealIcons, mealColor } from '../lib/meals'
import { calcDayChoTotals, calcMealChoBreakdown } from '../hooks/useDayPlan'
import { mealMacros } from '../lib/mealMacros'
import { SegmentedRing, type RingSegment } from './SegmentedRing'

interface Props {
  state: DayState
  templates: MealTemplate[]
  dayType: DayType
  week: number
  /** Target giornalieri del profilo. */
  proteinG?: number
  fatG?: number
}

function fmt(n: number) {
  return Math.round(n)
}

/**
 * Riepilogo del giorno: un anello per macro con quanto si mangia davvero,
 * diviso per pasto, e il target del giorno al centro.
 */
export function DayTotals({ state, templates, dayType, week, proteinG = 0, fatG = 0 }: Props) {
  const { actual, target } = calcDayChoTotals(week, dayType, state, templates)
  const diff = Math.round((actual - target) * 10) / 10
  const label = dayType === 'ON' ? 'Giorno energia' : 'Giorno recupero'

  const cho = calcMealChoBreakdown(week, dayType, state, templates)
  const macros = Object.fromEntries(meals.map((m) => [m, mealMacros(m, state[m])])) as Record<
    MealType,
    { prot: number; fat: number }
  >

  const choByMeal = (m: MealType) => cho.find((c) => c.meal === m)?.actual ?? 0
  const proteinByMeal = (m: MealType) => macros[m].prot
  const fatByMeal = (m: MealType) => macros[m].fat
  const proteinTot = meals.reduce((a, m) => a + proteinByMeal(m), 0)
  const fatTot = meals.reduce((a, m) => a + fatByMeal(m), 0)

  const segments = (valueOf: (m: MealType) => number): RingSegment[] =>
    meals.map((m) => ({ key: m, value: valueOf(m), color: mealColor(m), icon: mealIcons[m] }))

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
          <SegmentedRing segments={segments(proteinByMeal)} total={proteinG} label={`Proteine ${fmt(proteinTot)} su ${proteinG} grammi`}>
            <strong className="day-totals__value">{fmt(proteinTot)}</strong>
            <span className="day-totals__unit">/ {proteinG} g</span>
          </SegmentedRing>
          <figcaption>Proteine</figcaption>
        </figure>

        <figure className="day-totals__ring">
          <SegmentedRing segments={segments(fatByMeal)} total={fatG} label={`Grassi ${fmt(fatTot)} su ${fatG} grammi`}>
            <strong className="day-totals__value">{fmt(fatTot)}</strong>
            <span className="day-totals__unit">/ {fatG} g</span>
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
              <td>{fmt(proteinByMeal(m))} g</td>
              <td>{fmt(fatByMeal(m))} g</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="day-totals__note">
        Quanto si mangia con le scelte del giorno. Proteine contate dalle fonti proteiche, come nel piano; grassi da
        tutti gli alimenti, olio compreso. Valori indicativi.
      </p>
    </section>
  )
}
