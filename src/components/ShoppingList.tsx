import { useMemo, useState } from 'react'
import { weekDates, formatDayMonth } from '../lib/dateUtils'
import { loadDayPlan, defaultDayState } from '../hooks/useDayPlan'
import { templatesForWeek } from '../data/weekRegistry'
import { profiles } from '../data/profiles'
import { buildShoppingList, categoriaLabel, type ShoppingItem } from '../lib/shoppingList'
import type { DayPlanEntry } from '../lib/shoppingList'

interface Props {
  anchorDate: string
  onBack: () => void
}

const categoriaOrder = ['carboidrati', 'proteine', 'grassi', 'frutta', 'verdura', 'fruttaGrassi', 'alternativePome', 'aromi']

export function ShoppingList({ anchorDate, onBack }: Props) {
  const dates = weekDates(anchorDate)
  const [checked, setChecked] = useState<Set<string>>(() => new Set())

  const items = useMemo(() => {
    const entries: DayPlanEntry[] = []
    for (const date of dates) {
      for (const profile of profiles) {
        const saved = loadDayPlan(profile.id, date)
        const week = saved?.week ?? 1
        const dayType = saved?.dayType ?? 'ON'
        const state = saved?.state ?? defaultDayState(week, dayType, date)
        entries.push({ week, dayType, state, templates: templatesForWeek(week) })
      }
    }
    return buildShoppingList(entries)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorDate])

  const grouped = useMemo(() => {
    const byCategoria = new Map<string, ShoppingItem[]>()
    for (const item of items) {
      const list = byCategoria.get(item.categoria) ?? []
      list.push(item)
      byCategoria.set(item.categoria, list)
    }
    return categoriaOrder
      .filter((c) => byCategoria.has(c))
      .map((c) => ({ categoria: c, items: byCategoria.get(c)! }))
  }, [items])

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="shopping-list">
      <header className="shopping-list__header">
        <button className="shopping-list__back" onClick={onBack}>
          ← torna alla settimana
        </button>
        <h1>🛒 Spesa {formatDayMonth(dates[0])} – {formatDayMonth(dates[6])}</h1>
        <p className="shopping-list__nota">
          Ingredienti e grammature totali per Ezio e Arianna, per i 7 giorni di questa
          settimana (giorni non ancora aperti usano il piano di default).
        </p>
      </header>

      {grouped.length === 0 ? (
        <p>Nessun ingrediente trovato per questa settimana.</p>
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
                      <span className="shopping-list__grammi">{item.grammi} g</span>
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
