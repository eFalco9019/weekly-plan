import type { MealState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType } from '../types'
import { mealEquivalents } from '../hooks/useDayPlan'
import { recipes } from '../data/recipes'
import { recipesForMeal, scaleRecipe } from '../lib/recipeEngine'
import { mealLabels, mealIcons } from '../lib/meals'

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
  onAssignRecipe: (recipeId: string) => void
  onClearRecipe: () => void
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
  onAssignRecipe,
  onClearRecipe,
}: Props) {
  const groups = mealEquivalents(week, meal)
  const targetCho = template
    ? dayType === 'ON'
      ? template.targetChoOnG
      : template.targetChoOffG
    : undefined
  const carboScelta = mealState.scelte.carboidrati
  const recipeOptions = recipesForMeal(recipes, meal)
  const assignedRecipe = carboScelta?.recipeId
    ? recipes.find((r) => r.id === carboScelta.recipeId)
    : undefined
  const scaled =
    assignedRecipe && carboScelta
      ? scaleRecipe(assignedRecipe, {
          targetChoG: targetCho ?? 0,
          density: carboScelta.choPer100gOverride ?? 0,
          scalabileGrammi: carboScelta.grammi,
        })
      : undefined

  return (
    <section className={`meal-section meal-section--${meal}`}>
      <header>
        <h2>
          <span className="meal-section__icon" aria-hidden="true">
            {mealIcons[meal]}
          </span>
          {mealLabels[meal]}
        </h2>
        {targetCho !== undefined && targetCho > 0 && (
          <span className="meal-section__target">{targetCho} g CHO</span>
        )}
      </header>

      {recipeOptions.length > 0 && (
        <div className="meal-section__ricetta">
          {assignedRecipe ? (
            <div className="meal-section__ricetta-card">
              <div className="meal-section__ricetta-header">
                <strong>{assignedRecipe.nome}</strong>
                <button type="button" onClick={onClearRecipe}>
                  togli ricetta
                </button>
              </div>
              {scaled && (
                <p className="meal-section__ricetta-macro">
                  Questa porzione: <strong>{Math.round(scaled.macro.cho)} g</strong> carbo ·{' '}
                  <strong>{Math.round(scaled.macro.prot)} g</strong> proteine ·{' '}
                  <strong>{Math.round(scaled.macro.fat)} g</strong> grassi
                  <span className="meal-section__ricetta-macro-note"> (valori indicativi)</span>
                </p>
              )}
              <ul className="meal-section__ricetta-ingredienti">
                {scaled?.ingredienti.map((ing) =>
                  ing.scalabile ? (
                    <li key={ing.nome} className="meal-section__ricetta-scalabile">
                      <span>{ing.nome}</span>
                      <span className="meal-section__grammi">
                        <input
                          type="number"
                          aria-label={`Grammi di ${ing.nome}`}
                          value={carboScelta?.grammi ?? ing.grammi}
                          onChange={(e) => onSetCarboGrammi(Number(e.target.value))}
                        />
                        <span>g</span>
                      </span>
                    </li>
                  ) : (
                    <li key={ing.nome}>
                      <span>{ing.nome}</span>
                      <span>{ing.grammi} g</span>
                    </li>
                  ),
                )}
              </ul>
              <label className="meal-section__blocco">
                <input type="checkbox" checked={Boolean(carboScelta?.bloccato)} onChange={onToggleBlocco} />
                blocca (escludi dalla compensazione)
              </label>
              {assignedRecipe.preparazione && (
                <p className="meal-section__ricetta-prep">{assignedRecipe.preparazione}</p>
              )}
              {(assignedRecipe.fonteUrl || assignedRecipe.fonteNote) && (
                <p className="meal-section__ricetta-fonte">
                  Fonte:{' '}
                  {assignedRecipe.fonteUrl ? (
                    <a href={assignedRecipe.fonteUrl} target="_blank" rel="noreferrer">
                      {assignedRecipe.fonteNote ?? assignedRecipe.fonteUrl}
                    </a>
                  ) : (
                    assignedRecipe.fonteNote
                  )}
                </p>
              )}
            </div>
          ) : (
            <label className="meal-section__ricetta-picker">
              Ricetta della libreria
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onAssignRecipe(e.target.value)
                }}
              >
                <option value="">-- scegli una ricetta (opzionale) --</option>
                {recipeOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}

      {Object.entries(groups).map(([categoria, items]) => {
        const scelta = mealState.scelte[categoria]
        if (!scelta) return null
        // Con una ricetta il pasto è la ricetta intera: niente categorie da tabella.
        if (assignedRecipe) return null
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
