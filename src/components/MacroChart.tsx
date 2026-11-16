import type { MealType } from '../types'

export interface MacroChartBar {
  meal: MealType
  /** Valore effettivo (se non misurabile, es. proteine/grassi, omettere e usare solo target). */
  actual?: number
  target: number
}

interface Props {
  title: string
  icon: string
  color: string
  unit?: string
  bars: MacroChartBar[]
  note?: string
}

const mealShortLabels: Record<MealType, string> = {
  colazione: 'Colaz.',
  pranzo: 'Pranzo',
  spuntino: 'Spunt.',
  cena: 'Cena',
}

const BAR_HEIGHT = 108

export function MacroChart({ title, icon, color, unit = 'g', bars, note }: Props) {
  const max = Math.max(1, ...bars.map((b) => Math.max(b.actual ?? 0, b.target)))

  return (
    <div className="macro-chart">
      <div className="macro-chart__title">
        <span className="macro-chart__icon" aria-hidden="true">
          {icon}
        </span>
        {title}
      </div>
      <div className="macro-chart__bars">
        {bars.map((bar) => {
          const hasActual = bar.actual !== undefined
          const actualPct = hasActual ? Math.min(1, (bar.actual as number) / max) : 0
          const targetPct = Math.min(1, bar.target / max)
          return (
            <div className="macro-chart__col" key={bar.meal}>
              <div className="macro-chart__track" style={{ height: BAR_HEIGHT }}>
                {hasActual ? (
                  <div
                    className="macro-chart__fill"
                    style={{ height: `${actualPct * 100}%`, background: color }}
                  />
                ) : (
                  <div
                    className="macro-chart__fill macro-chart__fill--target-only"
                    style={{ height: `${targetPct * 100}%`, background: color }}
                  />
                )}
                {hasActual && (
                  <div className="macro-chart__target-line" style={{ bottom: `${targetPct * 100}%` }} />
                )}
              </div>
              <div className="macro-chart__value">
                {hasActual ? Math.round(bar.actual as number) : Math.round(bar.target)}
                <span className="macro-chart__unit">{unit}</span>
              </div>
              <div className="macro-chart__label">{mealShortLabels[bar.meal]}</div>
            </div>
          )
        })}
      </div>
      {note && <p className="macro-chart__note">{note}</p>}
    </div>
  )
}
