import type { ProfileId, MealType } from '../types'
import { useDayPlan } from '../hooks/useDayPlan'
import { MealSection } from './MealSection'
import { DayTotals } from './DayTotals'

interface Props {
  profile: ProfileId
  date: string
  onDateChange: (date: string) => void
  onChangeProfile: () => void
}

const meals: MealType[] = ['colazione', 'pranzo', 'spuntino', 'cena']

export function DayPlanner({ profile, date, onDateChange, onChangeProfile }: Props) {
  const plan = useDayPlan(profile, date)

  return (
    <div className="day-planner">
      <header className="day-planner__header">
        <button className="day-planner__back" onClick={onChangeProfile}>
          ← cambia profilo
        </button>
        <div className="day-planner__controls">
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
          <label>
            Settimana
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
              className={plan.dayType === 'ON' ? 'active' : ''}
              onClick={() => plan.setDayType('ON')}
            >
              ON
            </button>
            <button
              className={plan.dayType === 'OFF' ? 'active' : ''}
              onClick={() => plan.setDayType('OFF')}
            >
              OFF
            </button>
          </div>
        </div>
      </header>

      <DayTotals state={plan.state} templates={plan.templates} dayType={plan.dayType} week={plan.week} />

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
          />
        ))}
      </div>
    </div>
  )
}
