import { useState, type FormEvent } from 'react'
import type { DayType, MealType } from '../types'
import { checkPiano, choGiorno, kcal, mealTargets, pianoRiferimento, trackedMeals, type Piano } from '../data/piano'
import { signOut, type Profile } from '../lib/account'
import { localDates } from '../lib/planStore'
import { regenerateMenu } from '../hooks/useDayPlan'
import { toIso } from '../lib/dateUtils'
import { mealLabels, mealOrder } from '../lib/meals'
import { fmt1, fmtInt } from '../lib/format'

interface Props {
  profile: Profile
  email: string
  onSave: (p: Profile) => Promise<string | null>
  onBack: () => void
}

const days: DayType[] = ['ON', 'OFF']

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (n: number) => void; step?: number }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={label}
      min={0}
      step={step}
      value={Number.isFinite(value) ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
    />
  )
}

/** "Il mio piano": i fabbisogni dei giorni ON e OFF e come si dividono tra i pasti. */
export function PlanSettings({ profile, email, onSave, onBack }: Props) {
  const [nome, setNome] = useState(profile.nome)
  const [p, setP] = useState<Piano>(profile.piano)
  const [message, setMessage] = useState<string | null>(null)
  const errors = checkPiano(p)
  const valid = errors.length === 0 && Object.values(p).every((v) => typeof v !== 'number' || Number.isFinite(v))

  const set = (patch: Partial<Piano>) => {
    setP((prev) => ({ ...prev, ...patch }))
    setMessage(null)
  }
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + (b || 0), 0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    const saved: Profile = { nome: nome.trim(), piano: p }
    const err = await onSave(saved)
    // I giorni già salvati da oggi in poi si ricalcolano con i nuovi fabbisogni.
    const today = toIso(new Date())
    regenerateMenu(p, localDates().filter((d) => d >= today), 0)
    setMessage(err ?? 'Piano salvato. I menu da oggi in poi sono ricalcolati.')
  }

  const preview = valid ? mealTargets(p, 1) : []

  return (
    <div className="plan-settings">
      <button type="button" className="link-button" onClick={onBack}>
        ‹ Settimana
      </button>
      <h1>Il mio piano</h1>
      <p className="plan-settings__intro">
        Inserisci i valori indicati dal tuo nutrizionista. L'app li usa per calcolare le grammature di ogni pasto.
      </p>

      <form onSubmit={submit}>
        <section className="plan-settings__section">
          <label className="plan-settings__field">
            Nome
            <input required maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
        </section>

        <section className="plan-settings__section">
          <h2>Carboidrati</h2>
          <table className="plan-settings__grid">
            <thead>
              <tr>
                <th />
                {days.map((d) => (
                  <th key={d} scope="col">
                    Giorno {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Settimana 1 (g)</th>
                {days.map((d) => (
                  <td key={d}>
                    <Num label={`Carboidrati ${d} settimana 1`} value={p.choGiorno[d]} onChange={(n) => set({ choGiorno: { ...p.choGiorno, [d]: n } })} />
                  </td>
                ))}
              </tr>
              <tr>
                <th scope="row">In più ogni settimana (g)</th>
                {days.map((d) => (
                  <td key={d}>
                    <Num label={`Aumento settimanale ${d}`} value={p.choIncremento[d]} onChange={(n) => set({ choIncremento: { ...p.choIncremento, [d]: n } })} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="plan-settings__row">
            <label className="plan-settings__field">
              Durata del ciclo (settimane)
              <Num label="Durata del ciclo" value={p.settimane} onChange={(n) => set({ settimane: Math.round(n) })} />
            </label>
            <label className="plan-settings__field">
              Spuntino (g, porzioni fisse)
              <Num label="Carboidrati dello spuntino" step={0.5} value={p.choSpuntinoG} onChange={(n) => set({ choSpuntinoG: n })} />
            </label>
          </div>
        </section>

        <section className="plan-settings__section">
          <h2>Proteine e grassi</h2>
          <div className="plan-settings__row">
            <label className="plan-settings__field">
              Proteine (g al giorno)
              <Num label="Proteine al giorno" value={p.proteineG} onChange={(n) => set({ proteineG: n })} />
            </label>
            <label className="plan-settings__field">
              Grassi (g al giorno)
              <Num label="Grassi al giorno" value={p.grassiG} onChange={(n) => set({ grassiG: n })} />
            </label>
          </div>
        </section>

        <section className="plan-settings__section">
          <h2>Come si dividono tra i pasti</h2>
          <p className="plan-settings__hint">Percentuali. I carboidrati sono quelli che restano dopo lo spuntino.</p>
          <table className="plan-settings__grid">
            <thead>
              <tr>
                <th />
                <th scope="col">Carbo ON</th>
                <th scope="col">Carbo OFF</th>
                <th scope="col">Proteine</th>
              </tr>
            </thead>
            <tbody>
              {mealOrder.map((m: MealType) => (
                <tr key={m}>
                  <th scope="row">{mealLabels[m]}</th>
                  {days.map((d) =>
                    m === 'spuntino' ? (
                      <td key={d} className="plan-settings__fixed">
                        fisso
                      </td>
                    ) : (
                      <td key={d}>
                        <Num
                          label={`Quota carboidrati ${d} ${mealLabels[m]}`}
                          step={0.1}
                          value={p.quoteCho[d][m as (typeof trackedMeals)[number]]}
                          onChange={(n) => set({ quoteCho: { ...p.quoteCho, [d]: { ...p.quoteCho[d], [m]: n } } })}
                        />
                      </td>
                    ),
                  )}
                  <td>
                    <Num
                      label={`Quota proteine ${mealLabels[m]}`}
                      step={0.1}
                      value={p.quoteProteine[m]}
                      onChange={(n) => set({ quoteProteine: { ...p.quoteProteine, [m]: n } })}
                    />
                  </td>
                </tr>
              ))}
              <tr className="plan-settings__total">
                <th scope="row">Totale</th>
                <td>{fmt1(sum(p.quoteCho.ON))}%</td>
                <td>{fmt1(sum(p.quoteCho.OFF))}%</td>
                <td>{fmt1(sum(p.quoteProteine))}%</td>
              </tr>
            </tbody>
          </table>
        </section>

        {preview.length > 0 && (
          <section className="plan-settings__section">
            <h2>Anteprima, settimana 1</h2>
            <table className="plan-settings__grid plan-settings__preview">
              <thead>
                <tr>
                  <th />
                  <th scope="col">Carbo ON</th>
                  <th scope="col">Carbo OFF</th>
                  <th scope="col">Proteine</th>
                </tr>
              </thead>
              <tbody>
                {mealOrder.map((m) => {
                  const t = preview.find((x) => x.meal === m)!
                  return (
                    <tr key={m}>
                      <th scope="row">{mealLabels[m]}</th>
                      <td>{fmt1(t.choFissoG ?? t.targetChoOnG)} g</td>
                      <td>{fmt1(t.choFissoG ?? t.targetChoOffG)} g</td>
                      <td>{fmt1(t.targetProteinG ?? 0)} g</td>
                    </tr>
                  )
                })}
                <tr className="plan-settings__total">
                  <th scope="row">Giorno</th>
                  <td>
                    {fmtInt(choGiorno(p, 1, 'ON'))} g<small>{fmtInt(kcal(p, 1, 'ON'))} kcal</small>
                  </td>
                  <td>
                    {fmtInt(choGiorno(p, 1, 'OFF'))} g<small>{fmtInt(kcal(p, 1, 'OFF'))} kcal</small>
                  </td>
                  <td>{fmtInt(p.proteineG)} g</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {errors.length > 0 && (
          <ul className="plan-settings__errors" role="alert">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {message && (
          <p className="plan-settings__message" role="status">
            {message}
          </p>
        )}
        <div className="plan-settings__actions">
          <button type="submit" className="button button--primary" disabled={!valid}>
            Salva il piano
          </button>
          <button type="button" className="button button--quiet" onClick={() => set(pianoRiferimento)}>
            Riparti dal piano della dietista
          </button>
        </div>
      </form>

      <footer className="plan-settings__account">
        <span>{email || 'Solo su questo dispositivo'}</span>
        {email && (
          <button type="button" className="link-button" onClick={() => void signOut()}>
            Esci dall'account
          </button>
        )}
      </footer>
    </div>
  )
}
