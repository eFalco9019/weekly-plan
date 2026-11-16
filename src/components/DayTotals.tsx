import type { DayState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate } from '../types'
import { calcDayChoTotals } from '../hooks/useDayPlan'
import { CircularGauge } from './CircularGauge'

interface Props {
  state: DayState
  templates: MealTemplate[]
  dayType: DayType
  week: number
  proteinG?: number
  fatG?: number
}

export function DayTotals({ state, templates, dayType, week, proteinG, fatG }: Props) {
  const { actual, target } = calcDayChoTotals(week, dayType, state, templates)
  const diff = Math.round((actual - target) * 10) / 10
  const label = dayType === 'ON' ? 'Giorno energia' : 'Giorno recupero'
  const ringColor = dayType === 'ON' ? 'var(--energia)' : 'var(--recupero)'

  return (
    <div className={`day-totals day-totals--${dayType.toLowerCase()}`}>
      <CircularGauge value={actual} max={target || 1} color={ringColor} size={128} strokeWidth={11}>
        <strong className="day-totals__value">{Math.round(actual)}</strong>
        <span className="day-totals__unit">/ {Math.round(target)} g</span>
      </CircularGauge>

      <div className="day-totals__info">
        <span className="day-totals__label">{label}</span>
        <span className="day-totals__sub">
          Carboidrati{' '}
          {diff === 0 ? 'in linea con il target' : diff > 0 ? `+${diff} g sopra target` : `${diff} g sotto target`}
        </span>
        {(proteinG !== undefined || fatG !== undefined) && (
          <div className="day-totals__macros">
            {proteinG !== undefined && (
              <span className="day-totals__macro">
                <i className="day-totals__dot day-totals__dot--protein" />
                Proteine <strong>{proteinG} g</strong>
              </span>
            )}
            {fatG !== undefined && (
              <span className="day-totals__macro">
                <i className="day-totals__dot day-totals__dot--fat" />
                Grassi <strong>{fatG} g</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
