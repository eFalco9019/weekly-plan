import type { MealState } from '../hooks/useDayPlan'
import type { DayType, MealTemplate, MealType, ProfileId } from '../types'
import { mealEquivalents } from '../hooks/useDayPlan'
import { recipes } from '../data/recipes'
import { recipesForMeal, scaleRecipe } from '../lib/recipeEngine'
import { mealLabels, mealIcons } from '../lib/meals'
import { fmtInt } from '../lib/format'

/** Pulsante compatto per escludere il pasto dalla compensazione automatica. */
function LockToggle({ locked, onToggle }: { locked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="lock-toggle"
      aria-pressed={locked}
      onClick={onToggle}
      title={locked ? 'Bloccato: gli altri pasti non lo modificano' : 'Blocca questi grammi'}
    >
      <svg aria-hidden="true" viewBox="0 0 16 16" width="13" height="13">
        <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
        <path
          d={locked ? 'M5.5 7V5a2.5 2.5 0 0 1 5 0v2' : 'M5.5 7V5a2.5 2.5 0 0 1 4.8-1'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {locked ? 'Bloccato' : 'Blocca'}
    </button>
  )
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
  profile: ProfileId
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
  profile,
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
  const groups = mealEquivalents(week, meal, profile)
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
          <span className="meal-section__target">{fmtInt(targetCho)} g di carboidrati</span>
        )}
      </header>

      {recipeOptions.length > 0 && (
        <div className="meal-section__ricetta">
          {assignedRecipe ? (
            <div className="meal-section__ricetta-card">
              <div className="meal-section__ricetta-header">
                <strong>{assignedRecipe.nome}</strong>
                <button type="button" onClick={onClearRecipe}>
                  Togli la ricetta
                </button>
              </div>
              {scaled && (
                <dl className="meal-section__ricetta-macro" aria-label="Questa porzione, valori indicativi">
                  <div>
                    <dt>Carboidrati</dt>
                    <dd>{fmtInt(scaled.macro.cho)} g</dd>
                  </div>
                  <div>
                    <dt>Proteine</dt>
                    <dd>{fmtInt(scaled.macro.prot)} g</dd>
                  </div>
                  <div>
                    <dt>Grassi</dt>
                    <dd>{fmtInt(scaled.macro.fat)} g</dd>
                  </div>
                </dl>
              )}
              <ul className="meal-section__ricetta-ingredienti">
                {scaled?.ingredienti.map((ing) =>
                  ing.scalabile ? (
                    <li key={ing.nome} className="meal-section__ricetta-scalabile">
                      <span>{ing.nome}</span>
                      <span className="meal-section__grammi">
                        <input
                          type="number"
                          inputMode="numeric"
                          aria-label={`Grammi di ${ing.nome}`}
                          value={carboScelta?.grammi ?? ing.grammi}
                          onChange={(e) => onSetCarboGrammi(Number(e.target.value))}
                        />
                        <span>g</span>
                        <LockToggle locked={Boolean(carboScelta?.bloccato)} onToggle={onToggleBlocco} />
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
              <span className="visually-hidden">Usa una ricetta</span>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onAssignRecipe(e.target.value)
                }}
              >
                <option value="">Usa una ricetta della raccolta…</option>
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
            <label htmlFor={`${meal}-${categoria}`}>{categoriaLabels[categoria] ?? categoria}</label>
            <select
              id={`${meal}-${categoria}`}
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
                  inputMode="numeric"
                  aria-label={`Grammi di ${scelta.alimento}`}
                  value={scelta.grammi}
                  onChange={(e) => onSetCarboGrammi(Number(e.target.value))}
                />
                <span>g</span>
                <LockToggle locked={Boolean(scelta.bloccato)} onToggle={onToggleBlocco} />
              </div>
            ) : (
              <span className="meal-section__grammi-fisse">{fmtInt(scelta.grammi)} g</span>
            )}
          </div>
        )
      })}
    </section>
  )
}
