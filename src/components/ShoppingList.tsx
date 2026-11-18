import { useEffect, useState } from 'react'
import { weekDates } from '../lib/dateUtils'
import { fmtWeight, rangeName } from '../lib/format'
import { dayOrDefault } from '../hooks/useDayPlan'
import type { Piano } from '../data/piano'
import { buildShoppingList, categoriaLabel, type ShoppingItem } from '../lib/shoppingList'
import { onRemotePlanChange } from '../lib/planStore'

interface Props {
  piano: Piano
  anchorDate: string
  onBack: () => void
}

const categoriaOrder = ['carboidrati', 'proteine', 'grassi', 'frutta', 'verdura', 'fruttaGrassi', 'alternativePome', 'aromi']

export function ShoppingList({ piano, anchorDate, onBack }: Props) {
  const dates = weekDates(anchorDate)
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  // Si ridisegna se un altro dispositivo cambia un giorno della settimana.
  const [, setTick] = useState(0)
  useEffect(() => onRemotePlanChange(() => setTick((t) => t + 1)), [])

  const byCategoria = new Map<string, ShoppingItem[]>()
  for (const item of buildShoppingList(dates.map((d) => dayOrDefault(piano, d).state))) {
    byCategoria.set(item.categoria, [...(byCategoria.get(item.categoria) ?? []), item])
  }
  const grouped = categoriaOrder.filter((c) => byCategoria.has(c)).map((c) => ({ categoria: c, items: byCategoria.get(c)! }))

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }

  return (
    <div className="shopping-list">
      <header className="shopping-list__header">
        <button type="button" className="link-button" onClick={onBack}>
          ‹ Settimana
        </button>
        <h1>Spesa del {rangeName(dates[0], dates[6])}</h1>
        <p className="shopping-list__nota">Tutti e 7 i giorni del tuo menu, olio compreso.</p>
      </header>

      {grouped.length === 0 ? (
        <p>Questa settimana non ha ancora pasti da comprare.</p>
      ) : (
        grouped.map((group) => (
          <section className="shopping-list__group" data-categoria={group.categoria} key={group.categoria}>
            <h2>
              <i className="shopping-list__dot" aria-hidden="true" />
              {categoriaLabel(group.categoria)}
            </h2>
            <ul>
              {group.items.map((item) => {
                const key = `${group.categoria}__${item.nome}`
                const isChecked = checked.has(key)
                return (
                  <li key={key} className={isChecked ? 'shopping-list__item--checked' : ''}>
                    <label>
                      <input type="checkbox" checked={isChecked} onChange={() => toggle(key)} />
                      <span className="shopping-list__nome">{item.nome}</span>
                      <span className="shopping-list__grammi">{fmtWeight(item.grammi)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
