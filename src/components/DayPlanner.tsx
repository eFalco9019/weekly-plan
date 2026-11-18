import { useState } from 'react'
import type { MealType } from '../types'
import { useDayPlan } from '../hooks/useDayPlan'
import type { Piano } from '../data/piano'
import { addDays } from '../lib/dateUtils'
import { dayMonthName, weekdayName } from '../lib/format'
import { MealSection } from './MealSection'
import { DayTotals } from './DayTotals'
import { DayTypeSwitch } from './DayTypeSwitch'

interface Props {
  piano: Piano
  nome: string
  date: string
  onDateChange: (date: string) => void
  onBackToWeek: () => void
}

const meals: MealType[] = ['colazione', 'pranzo', 'spuntino', 'cena']

export function DayPlanner({ piano, nome, date, onDateChange, onBackToWeek }: Props) {
  const plan = useDayPlan(piano, date)
  const [noteOpen, setNoteOpen] = useState(false)
  const showNoteInput = noteOpen || plan.note.length > 0

  return (
    <div className="day-planner">
      <header className="day-planner__header">
        <button type="button" className="link-button day-planner__back" onClick={onBackToWeek}>
          ‹ {nome ? `Settimana di ${nome}` : 'Settimana'}
        </button>

        <div className="day-planner__title">
          <button
            type="button"
            className="icon-button"
            onClick={() => onDateChange(addDays(date, -1))}
            aria-label="Giorno precedente"
          >
            ‹
          </button>
          <h1>
            {weekdayName(date)} <span>{dayMonthName(date)}</span>
          </h1>
          <button
            type="button"
            className="icon-button"
            onClick={() => onDateChange(addDays(date, 1))}
            aria-label="Giorno successivo"
          >
            ›
          </button>
        </div>

        <div className="day-planner__controls">
          <DayTypeSwitch value={plan.dayType} onChange={plan.setDayType} label="Tipo di giorno" />
          <label className="day-planner__week">
            Settimana del ciclo
            <select value={plan.week} onChange={(e) => plan.setWeek(Number(e.target.value))}>
              {Array.from({ length: piano.settimane }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="day-planner__layout">
        <aside className="day-planner__summary">
          <DayTotals piano={piano} state={plan.state} dayType={plan.dayType} week={plan.week} />

          <div className="day-planner__note">
            {showNoteInput ? (
              <label>
                Nota del giorno
                <input
                  type="text"
                  value={plan.note}
                  autoFocus={noteOpen && plan.note.length === 0}
                  placeholder="Allenamento del giorno, es. basket o palestra gambe"
                  onChange={(e) => plan.setNote(e.target.value)}
                  onBlur={() => setNoteOpen(false)}
                />
              </label>
            ) : (
              <button type="button" className="link-button" onClick={() => setNoteOpen(true)}>
                Aggiungi una nota sull'allenamento
              </button>
            )}
          </div>
        </aside>

        <div className="day-planner__meals">
          <p className="day-planner__hint">
            Se cambi i grammi di carboidrati di un pasto, gli altri pasti si adattano per tenere il totale del giorno.
            Blocca un pasto per lasciarlo com'è.
          </p>
          {meals.map((meal) => (
            <MealSection
              key={meal}
              piano={piano}
              meal={meal}
              mealState={plan.state[meal]}
              dayType={plan.dayType}
              week={plan.week}
              template={plan.templates.find((t) => t.meal === meal)}
              onSetAlimento={(categoria, alimento) => plan.setAlimento(meal, categoria, alimento)}
              onSetCarboGrammi={(grammi) => plan.setCarboGrammi(meal, grammi)}
              onToggleBlocco={() => plan.toggleBlocco(meal)}
              onAssignRecipe={(recipeId) => plan.assignRecipe(meal, recipeId)}
              onClearRecipe={() => plan.clearRecipe(meal)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
