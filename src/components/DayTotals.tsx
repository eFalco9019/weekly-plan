import type { DayState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { mealEquivalents } from '../hooks/useDayPlan'
import { calcMealCho } from '../lib/macroEngine'

interface Props {
  state: DayState
  templates: MealTemplate[]
  dayType: DayType
}

export function DayTotals({ state, templates, dayType }: Props) {
  let totalActual = 0
  let totalTarget = 0

  for (const meal of ['colazione', 'pranzo', 'cena', 'spuntino'] as MealType[]) {
    const template = templates.find((t) => t.meal === meal)
    const scelta = state[meal].scelte.carboidrati
    if (!template || !scelta) continue
    const equivalent = mealEquivalents(meal).carboidrati.find((e) => e.alimento === scelta.alimento)
    if (!equivalent) continue
    totalActual += calcMealCho(
      { profile: 'ezio', date: '', meal, categoria: 'carboidrati', alimento: scelta.alimento, grammi: scelta.grammi },
      equivalent,
    )
    totalTarget += dayType === 'ON' ? template.targetChoOnG : template.targetChoOffG
  }

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
