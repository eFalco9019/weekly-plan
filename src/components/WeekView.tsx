import { useState } from 'react'
import type { DayType, ProfileId } from '../types'
import { weekDates, formatDayMonth, toIso } from '../lib/dateUtils'
import { loadDayPlan, defaultDayState, calcDayChoTotals, setDayTypeForDate, setNoteForDate } from '../hooks/useDayPlan'
import { templatesForWeek } from '../data/weekRegistry'
import { describeMeal } from '../lib/mealLabel'
import { mealLabels, mealColor } from '../lib/meals'
import type { MealType } from '../types'

/** Pasti principali mostrati nella card del giorno (lo spuntino resta nel dettaglio). */
const mainMeals: MealType[] = ['colazione', 'pranzo', 'cena']

interface Props {
  profile: ProfileId
  anchorDate: string
  onNavigateWeek: (deltaWeeks: number) => void
  onSelectDay: (date: string) => void
  onChangeProfile: () => void
  onOpenShoppingList: () => void
}

const weekdayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

export function WeekView({
  profile,
  anchorDate,
  onNavigateWeek,
  onSelectDay,
  onChangeProfile,
  onOpenShoppingList,
}: Props) {
  const dates = weekDates(anchorDate)
  const todayIso = toIso(new Date())
  // Forza il ricalcolo dopo un cambio ON/OFF inline (i dati vivono in
  // localStorage, non in uno state React, quindi serve un re-render esplicito).
  const [, setTick] = useState(0)

  function handleToggleDayType(date: string, dayType: DayType) {
    setDayTypeForDate(profile, date, dayType)
    setTick((t) => t + 1)
  }

  function handleSaveNote(date: string, note: string) {
    setNoteForDate(profile, date, note)
    setTick((t) => t + 1)
  }

  return (
    <div className="week-view">
      <header className="week-view__header">
        <div className="week-view__heading">
          <button className="week-view__back" onClick={onChangeProfile}>
            ← cambia profilo
          </button>
          <h1>La tua settimana</h1>
        </div>
        <div className="week-view__toolbar">
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
          <button className="week-view__shopping" onClick={onOpenShoppingList}>
            🛒 Lista della spesa
          </button>
        </div>
      </header>

      <div className="week-view__list">
        {dates.map((date, i) => {
          const saved = loadDayPlan(profile, date)
          const week = saved?.week ?? 1
          const dayType = saved?.dayType ?? 'ON'
          const state = saved?.state ?? defaultDayState(week, dayType)
          const templates = templatesForWeek(week)
          const { actual, target } = calcDayChoTotals(week, dayType, state, templates)
          const isToday = date === todayIso

          return (
            <div
              key={date}
              className={`week-view__day week-view__day--${dayType.toLowerCase()}${isToday ? ' week-view__day--today' : ''}`}
            >
              <div className="week-view__day-main">
                <button
                  type="button"
                  className="week-view__day-open"
                  onClick={() => onSelectDay(date)}
                  aria-label={`Apri ${weekdayLabels[i]} ${formatDayMonth(date)}`}
                >
                  <div className="week-view__day-head">
                    <span className="week-view__weekday">
                      {weekdayLabels[i]}
                      {isToday && <span className="week-view__today-tag">oggi</span>}
                    </span>
                    <span className="week-view__daynum">{formatDayMonth(date)}</span>
                  </div>
                  <div className="week-view__cho">
                    <strong>{Math.round(actual * 10) / 10}</strong> / {Math.round(target * 10) / 10} g CHO ·
                    Sett. {week}
                  </div>
                  <span className="week-view__menu">
                    {mainMeals.map((meal) => {
                      const dish = describeMeal(meal, state[meal])
                      if (!dish) return null
                      return (
                        <span key={meal} className="week-view__menu-row">
                          <span className="week-view__menu-meal">
                            <i className="week-view__menu-dot" style={{ background: mealColor(meal) }} />
                            {mealLabels[meal]}
                          </span>
                          <span className="week-view__menu-dish">{dish}</span>
                        </span>
                      )
                    })}
                  </span>
                  <span className="week-view__open-hint">apri il dettaglio →</span>
                </button>

                <div className="week-view__day-toggle" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={dayType === 'ON' ? 'active active--on' : ''}
                    onClick={() => handleToggleDayType(date, 'ON')}
                  >
                    ON
                  </button>
                  <button
                    type="button"
                    className={dayType === 'OFF' ? 'active active--off' : ''}
                    onClick={() => handleToggleDayType(date, 'OFF')}
                  >
                    OFF
                  </button>
                </div>
              </div>

              <div className="week-view__day-note" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  key={`${date}-note-${saved?.note ?? ''}`}
                  defaultValue={saved?.note ?? ''}
                  placeholder="✎ Nota (es. corsa 10km, palestra gambe...)"
                  onBlur={(e) => handleSaveNote(date, e.target.value)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="week-view__nota">
        Tocca un giorno per aprirlo nel dettaglio, oppure cambia ON/OFF direttamente da qui.
      </p>
    </div>
  )
}
