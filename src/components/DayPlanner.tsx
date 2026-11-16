import type { ProfileId, MealType } from '../types'
import { useDayPlan } from '../hooks/useDayPlan'
import { profiles } from '../data/profiles'
import { MealSection } from './MealSection'
import { DayTotals } from './DayTotals'

interface Props {
  profile: ProfileId
  date: string
  onDateChange: (date: string) => void
  onBackToWeek: () => void
}

const meals: MealType[] = ['colazione', 'pranzo', 'spuntino', 'cena']

export function DayPlanner({ profile, date, onDateChange, onBackToWeek }: Props) {
  const plan = useDayPlan(profile, date)
  const profileData = profiles.find((p) => p.id === profile)

  return (
    <div className="day-planner">
      <header className="day-planner__header">
        <button className="day-planner__back" onClick={onBackToWeek}>
          ← torna alla settimana
        </button>
        <div className="day-planner__controls">
          <input
            className="day-planner__date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
          <label className="day-planner__week">
            Sett.
            <select value={plan.week} onChange={(e) => plan.setWeek(Number(e.target.value))}>
              {[1, 2, 3, 4].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
          <div className="day-planner__daytype">
            <button
              className={plan.dayType === 'ON' ? 'active active--on' : ''}
              onClick={() => plan.setDayType('ON')}
            >
              ON
            </button>
            <button
              className={plan.dayType === 'OFF' ? 'active active--off' : ''}
              onClick={() => plan.setDayType('OFF')}
            >
              OFF
            </button>
          </div>
        </div>
      </header>

      <DayTotals
        state={plan.state}
        templates={plan.templates}
        dayType={plan.dayType}
        week={plan.week}
        proteinG={profileData?.proteineGFisse}
        fatG={profileData?.grassiGFissi}
      />

      <label className="day-planner__note">
        Nota del giorno (es. tipo di allenamento)
        <input
          type="text"
          value={plan.note}
          placeholder="es. corsa 10 km, palestra gambe, riposo..."
          onChange={(e) => plan.setNote(e.target.value)}
        />
      </label>

      <div className="day-planner__meals">
        {meals.map((meal) => (
          <MealSection
            key={meal}
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
  )
}
