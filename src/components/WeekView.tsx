import type { ProfileId } from '../types'
import { weekDates, formatDayMonth, toIso } from '../lib/dateUtils'
import { loadDayPlan, defaultDayState, calcDayChoTotals } from '../hooks/useDayPlan'
import { templatesForWeek } from '../data/weekRegistry'
import { recipes } from '../data/recipes'

interface Props {
  profile: ProfileId
  anchorDate: string
  onNavigateWeek: (deltaWeeks: number) => void
  onSelectDay: (date: string) => void
  onChangeProfile: () => void
}

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export function WeekView({ profile, anchorDate, onNavigateWeek, onSelectDay, onChangeProfile }: Props) {
  const dates = weekDates(anchorDate)
  const todayIso = toIso(new Date())

  return (
    <div className="week-view">
      <header className="week-view__header">
        <button className="week-view__back" onClick={onChangeProfile}>
          ← cambia profilo
        </button>
        <div className="week-view__nav">
          <button onClick={() => onNavigateWeek(-1)} aria-label="settimana precedente">
            ‹
          </button>
          <strong>
            {formatDayMonth(dates[0])} – {formatDayMonth(dates[6])}
          </strong>
          <button onClick={() => onNavigateWeek(1)} aria-label="settimana successiva">
            ›
          </button>
        </div>
      </header>

      <div className="week-view__grid">
        {dates.map((date, i) => {
          const saved = loadDayPlan(profile, date)
          const week = saved?.week ?? 1
          const dayType = saved?.dayType ?? 'ON'
          const state = saved?.state ?? defaultDayState(week, dayType)
          const templates = templatesForWeek(week)
          const { actual, target } = calcDayChoTotals(week, dayType, state, templates)
          const pranzoScelta = state.pranzo?.scelte.carboidrati
          const pranzoLabel = pranzoScelta?.recipeId
            ? recipes.find((r) => r.id === pranzoScelta.recipeId)?.nome
            : pranzoScelta?.alimento
          const isToday = date === todayIso

          return (
            <button
              key={date}
              type="button"
              className={`week-view__day${isToday ? ' week-view__day--today' : ''}`}
              onClick={() => onSelectDay(date)}
            >
              <div className="week-view__day-head">
                <span className="week-view__weekday">{weekdayLabels[i]}</span>
                <span className="week-view__daynum">{formatDayMonth(date)}</span>
              </div>
              <div className="week-view__badges">
                <span className={`week-view__badge week-view__badge--${dayType.toLowerCase()}`}>
                  {dayType}
                </span>
                <span className="week-view__badge week-view__badge--week">Sett. {week}</span>
              </div>
              <div className="week-view__cho">
                {Math.round(actual * 10) / 10} / {Math.round(target * 10) / 10} g CHO
              </div>
              {pranzoLabel && <div className="week-view__pranzo">🍽️ {pranzoLabel}</div>}
            </button>
          )
        })}
      </div>

      <p className="week-view__nota">Tocca un giorno per aprirlo e modificarlo nel dettaglio.</p>
    </div>
  )
}
