import type { MealState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { mealEquivalents } from '../hooks/useDayPlan'

const mealLabels: Record<MealType, string> = {
  colazione: 'Colazione',
  pranzo: 'Pranzo',
  spuntino: 'Spuntino',
  cena: 'Cena',
}

const categoriaLabels: Record<string, string> = {
  carboidrati: 'Carboidrati',
  proteine: 'Proteine',
  grassi: 'Grassi',
  frutta: 'Frutta',
  verdura: 'Verdure',
  fruttaGrassi: 'Frutta + grassi',
  alternativePome: 'Alternative pomeridiane',
}

interface Props {
  meal: MealType
  mealState: MealState
  dayType: DayType
  week: number
  template?: MealTemplate
  onSetAlimento: (categoria: string, alimento: string) => void
  onSetCarboGrammi: (grammi: number) => void
  onToggleBlocco: () => void
}

export function MealSection({
  meal,
  mealState,
  dayType,
  week,
  template,
  onSetAlimento,
  onSetCarboGrammi,
  onToggleBlocco,
}: Props) {
  const groups = mealEquivalents(week, meal)
  const targetCho = template
    ? dayType === 'ON'
      ? template.targetChoOnG
      : template.targetChoOffG
    : undefined
  const carboScelta = mealState.scelte.carboidrati

  return (
    <section className="meal-section">
      <header>
        <h2>{mealLabels[meal]}</h2>
        {targetCho !== undefined && targetCho > 0 && (
          <span className="meal-section__target">target {targetCho} g CHO</span>
        )}
      </header>

      {Object.entries(groups).map(([categoria, items]) => {
        const scelta = mealState.scelte[categoria]
        if (!scelta) return null
        return (
          <div className="meal-section__categoria" key={categoria}>
            <label>{categoriaLabels[categoria] ?? categoria}</label>
            <select
              value={scelta.alimento}
              onChange={(e) => onSetAlimento(categoria, e.target.value)}
            >
              {items.map((item) => (
                <option key={item.alimento} value={item.alimento}>
                  {item.alimento}
                </option>
              ))}
            </select>

            {categoria === 'carboidrati' ? (
              <div className="meal-section__grammi">
                <input
                  type="number"
                  value={scelta.grammi}
                  onChange={(e) => onSetCarboGrammi(Number(e.target.value))}
                />
                <span>g</span>
                <label className="meal-section__blocco">
                  <input
                    type="checkbox"
                    checked={Boolean(scelta.bloccato)}
                    onChange={onToggleBlocco}
                  />
                  blocca (escludi dalla compensazione)
                </label>
              </div>
            ) : (
              <span className="meal-section__grammi-fisse">{scelta.grammi} g</span>
            )}
          </div>
        )
      })}
      {carboScelta && targetCho !== undefined && targetCho > 0 && (
        <p className="meal-section__nota">
          Cambiando i grammi qui, gli altri pasti non bloccati della giornata si
          adattano in automatico per mantenere il totale di CHO giornaliero.
        </p>
      )}
    </section>
  )
}
