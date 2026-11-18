import { describe, expect, test } from 'vitest'
import { checkPiano, equivalents, mealTarget, pianoRiferimento, pianoStimaEzio, type Piano } from '../data/piano'
import { template } from '../data/template'
import { calcDayChoTotals, defaultDayState } from '../hooks/useDayPlan'
import { rebalanceDay, mealCho, type EngineMeal } from '../lib/macroEngine'
import { foodAlternatives } from '../lib/rotation'
import { buildShoppingList } from '../lib/shoppingList'
import type { DayType, MealType } from '../types'

const ari = pianoRiferimento
const day = (start: string, i: number) => {
  const d = new Date(`${start}T00:00:00`)
  d.setDate(d.getDate() + i)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('piano di riferimento (dietista di Arianna)', () => {
  test('target dei pasti della settimana 1 uguali a quelli del piano', () => {
    const t = (m: MealType) => mealTarget(ari, 1, m)
    expect([t('colazione'), t('pranzo'), t('cena')].map((x) => [x.targetChoOnG, x.targetChoOffG])).toEqual([
      [47.5, 32.5],
      [50, 40],
      [40, 25],
    ])
    expect(t('spuntino').choFissoG).toBe(52.5)
    expect((['colazione', 'pranzo', 'spuntino', 'cena'] as MealType[]).map((m) => t(m).targetProteinG)).toEqual([25, 30, 11, 54])
  })

  test('le tabelle della settimana 1 sono quelle della dietista', () => {
    for (const meal of Object.keys(template) as MealType[])
      for (const [categoria, foods] of Object.entries(template[meal]))
        expect(equivalents(ari, 1, meal)[categoria].map((f) => [f.alimento, f.grammiOn, f.grammiOff])).toEqual(foods)
  })
})

describe('totale dei carboidrati del giorno', () => {
  const cases: [string, Piano, (w: number, d: DayType) => number][] = [
    ['Arianna', ari, (w, d) => (d === 'ON' ? 190 : 150) + 10 * (w - 1)],
    ['Ezio', pianoStimaEzio, (_w, d) => (d === 'ON' ? 440 : 300)],
  ]
  for (const [nome, piano, expected] of cases)
    test(`${nome}: target e menu proposti centrano il totale`, () => {
      for (let w = 1; w <= 4; w++)
        for (const d of ['ON', 'OFF'] as DayType[])
          for (let i = 0; i < 14; i++) {
            const { actual, target } = calcDayChoTotals(piano, w, d, defaultDayState(piano, w, d, day('2026-11-16', i)))
            expect(target).toBe(expected(w, d))
            expect(Math.abs(actual - target)).toBeLessThan(3.5)
          }
    })
})

test('varietà: nessun alimento principale due volte nello stesso giorno', () => {
  for (let i = 0; i < 28; i++) {
    const state = defaultDayState(ari, 1, 'ON', day('2026-11-16', i))
    const seen: string[] = []
    for (const meal of ['colazione', 'pranzo', 'cena'] as MealType[]) {
      if (state[meal].scelte.carboidrati?.recipeId) continue
      for (const cat of ['carboidrati', 'proteine', 'verdura']) {
        const a = state[meal].scelte[cat]?.alimento
        if (!a) continue
        for (const alt of foodAlternatives(a)) {
          expect(seen, `${day('2026-11-16', i)} ${meal} ${a}`).not.toContain(alt)
          seen.push(alt)
        }
      }
    }
  }
})

test('la compensazione mantiene il totale del giorno', () => {
  const meals: EngineMeal[] = [
    { meal: 'colazione', target: 47.5, grammi: 80, density: 73.1 },
    { meal: 'pranzo', target: 50, grammi: 68, density: 76.9, fissi: 0 },
    { meal: 'cena', target: 40, grammi: 50, density: 80 },
  ]
  const out = rebalanceDay(meals, 'colazione')
  const total = meals.reduce((s, m) => s + mealCho({ ...m, grammi: out[m.meal] ?? m.grammi }), 0)
  expect(Math.abs(total - 137.5)).toBeLessThan(1.5)
  expect(rebalanceDay(meals.map((m) => (m.meal === 'cena' ? { ...m, bloccato: true } : m)), 'colazione').cena).toBeUndefined()
})

test('controlli del piano', () => {
  expect(checkPiano(ari)).toEqual([])
  expect(checkPiano({ ...ari, quoteCho: { ...ari.quoteCho, ON: { colazione: 50, pranzo: 50, cena: 10 } } })).toHaveLength(1)
})

test('la spesa scompone gli alimenti composti', () => {
  const state = defaultDayState(ari, 1, 'ON')
  state.colazione.scelte.proteine = { alimento: '1 uovo intero + albume', grammi: 180 }
  state.pranzo.scelte.carboidrati = { alimento: 'Riso basmati', grammi: 65 }
  state.pranzo.scelte.proteine = { alimento: 'Petto di pollo', grammi: 135 }
  const nomi = buildShoppingList([state]).map((i) => i.nome)
  expect(nomi).toEqual(expect.arrayContaining(['Albume', 'Uovo intero', 'Olio EVO']))
  expect(nomi).not.toContain('1 uovo intero + albume')
})
