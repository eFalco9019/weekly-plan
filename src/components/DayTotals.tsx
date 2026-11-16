import type { DayState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate } from '../types'
import { calcDayChoTotals } from '../hooks/useDayPlan'

interface Props {
  state: DayState
  templates: MealTemplate[]
  dayType: DayType
  week: number
}

export function DayTotals({ state, templates, dayType, week }: Props) {
  const { actual: totalActual, target: totalTarget } = calcDayChoTotals(week, dayType, state, templates)
  const diff = Math.round((totalActual - totalTarget) * 10) / 10

  return (
    <div className="day-totals">
      <strong>Totale CHO giornaliero:</strong> {Math.round(totalActual * 10) / 10} g
      {' '}/ target {Math.round(totalTarget * 10) / 10} g
      {diff !== 0 && (
        <span className={diff > 0 ? 'day-totals__over' : 'day-totals__under'}>
          {' '}({diff > 0 ? '+' : ''}{diff} g)
        </span>
      )}
    </div>
  )
}
