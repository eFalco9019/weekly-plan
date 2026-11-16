import { useEffect, useState } from 'react'
import type { DayType, ProfileId } from '../types'
import { weekDates, toIso } from '../lib/dateUtils'
import {
  loadDayPlan,
  defaultDayState,
  calcDayChoTotals,
  setDayTypeForDate,
  setNoteForDate,
  regenerateMenu,
} from '../hooks/useDayPlan'
import { templatesForWeek } from '../data/weekRegistry'
import { profiles } from '../data/profiles'
import { describeMeal } from '../lib/mealLabel'
import { onRemotePlanChange } from '../lib/planStore'
import { fmtInt, rangeName, weekdayName } from '../lib/format'
import { SyncBadge } from './SyncBadge'
import { DayTypeSwitch } from './DayTypeSwitch'
import { mealLabels, mealColor } from '../lib/meals'
import type { MealType } from '../types'

/** Pasti principali mostrati nella card del giorno (lo spuntino resta nel dettaglio). */
const mainMeals: MealType[] = ['colazione', 'pranzo', 'cena']

interface Props {
  profile: ProfileId
  anchorDate: string
  onNavigateWeek: (deltaWeeks: number) => void
  onSelectDay: (date: string) => void
  onChangeProfile: (id: ProfileId) => void
  onOpenShoppingList: () => void
}

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
  const profileName = profiles.find((p) => p.id === profile)?.nome ?? ''
  const otherProfile = profiles.find((p) => p.id !== profile)
  // Forza il ricalcolo dopo un cambio ON/OFF inline (i dati vivono in
  // localStorage, non in uno state React, quindi serve un re-render esplicito).
  const [, setTick] = useState(0)
  const [shuffledWeek, setShuffledWeek] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)

  // Modifiche arrivate da un altro dispositivo: si ridisegna la settimana.
  useEffect(() => onRemotePlanChange(() => setTick((t) => t + 1)), [])

  function handleToggleDayType(date: string, dayType: DayType) {
    setDayTypeForDate(profile, date, dayType)
    setTick((t) => t + 1)
  }

  function handleShuffleWeek() {
    regenerateMenu(profile, dates, 1 + Math.floor(Math.random() * 10_000))
    setShuffledWeek(dates[0])
    setTick((t) => t + 1)
  }

  function handleSaveNote(date: string, note: string) {
    setNoteForDate(profile, date, note.trim())
    setEditingNote(null)
    setTick((t) => t + 1)
  }

  const days = dates.map((date) => {
    const saved = loadDayPlan(profile, date)
    const week = saved?.week ?? 1
    const dayType: DayType = saved?.dayType ?? 'ON'
    const state = saved?.state ?? defaultDayState(profile, week, dayType, date)
    const { actual, target } = calcDayChoTotals(week, dayType, state, templatesForWeek(week, profile))
    return { date, week, dayType, state, actual, target, note: saved?.note ?? '' }
  })
  const cycleWeeks = [...new Set(days.map((d) => d.week))]
  const onDays = days.filter((d) => d.dayType === 'ON').length

  return (
    <div className="week-view">
      <header className="week-view__header">
        <div className="week-view__heading">
          <h1>La settimana di {profileName}</h1>
          <p className="week-view__summary">
            Settimana {cycleWeeks.join(' e ')} del ciclo, con {onDays} {onDays === 1 ? 'giorno' : 'giorni'} ON e{' '}
            {7 - onDays} OFF.
          </p>
          <div className="week-view__meta">
            <SyncBadge />
            {otherProfile && (
              <button type="button" className="link-button" onClick={() => onChangeProfile(otherProfile.id)}>
                Passa a {otherProfile.nome}
              </button>
            )}
          </div>
        </div>
        <div className="week-view__toolbar">
          <div className="week-view__nav">
            <button type="button" onClick={() => onNavigateWeek(-1)} aria-label="Settimana precedente">
              ‹
            </button>
            <strong>{rangeName(dates[0], dates[6])}</strong>
            <button type="button" onClick={() => onNavigateWeek(1)} aria-label="Settimana successiva">
              ›
            </button>
          </div>
          <div className="week-view__actions">
            <button type="button" className="button button--quiet" onClick={handleShuffleWeek}>
              Varia il menu
            </button>
            <button type="button" className="button button--primary" onClick={onOpenShoppingList}>
              Lista della spesa
            </button>
          </div>
        </div>
        {shuffledWeek === dates[0] && (
          <p className="week-view__feedback" role="status">
            Menu variato. ON/OFF, note e ricette scelte a mano restano com'erano.
          </p>
        )}
      </header>

      <ol className="week-view__list">
        {days.map(({ date, dayType, state, actual, target, note }) => {
          const isToday = date === todayIso
          const isEditing = editingNote === date
          return (
            <li
              key={date}
              className={`week-view__day week-view__day--${dayType.toLowerCase()}${isToday ? ' week-view__day--today' : ''}`}
            >
              <button
                type="button"
                className="week-view__day-open"
                onClick={() => onSelectDay(date)}
                aria-label={`Apri ${weekdayName(date)} ${new Date(`${date}T00:00:00`).getDate()}`}
              >
                <span className="week-view__day-head">
                  <span className="week-view__weekday">{weekdayName(date)}</span>
                  <span className="week-view__daynum">{new Date(`${date}T00:00:00`).getDate()}</span>
                  {isToday && <span className="week-view__today-tag">oggi</span>}
                </span>
                <span className="week-view__cho">
                  <strong>{fmtInt(actual)}</strong> su {fmtInt(target)} g di carboidrati
                </span>
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
              </button>

              <DayTypeSwitch
                className="week-view__day-toggle"
                value={dayType}
                onChange={(t) => handleToggleDayType(date, t)}
                label={`Tipo di giorno, ${weekdayName(date)}`}
              />

              <div className="week-view__day-note">
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    defaultValue={note}
                    aria-label={`Nota di ${weekdayName(date)}`}
                    placeholder="Allenamento del giorno, es. basket o palestra gambe"
                    onBlur={(e) => handleSaveNote(date, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') setEditingNote(null)
                    }}
                  />
                ) : (
                  <button type="button" className="week-view__note-button" onClick={() => setEditingNote(date)}>
                    {note ? note : <span className="week-view__note-empty">Aggiungi una nota</span>}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
