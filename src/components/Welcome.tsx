import { useEffect, useState, type FormEvent } from 'react'
import { legacyAvailable, type Profile } from '../lib/account'
import { pianoRiferimento, pianoStimaEzio } from '../data/piano'

const starts = {
  riferimento: { label: 'Piano della dietista di Arianna', hint: 'Il modello di partenza: lo adatti ai tuoi fabbisogni.', piano: pianoRiferimento },
  ezio: { label: 'Stima provvisoria di Ezio', hint: 'Da sostituire con i valori del professionista.', piano: pianoStimaEzio },
}

const legacyNames: Record<string, string> = { arianna: 'Arianna', ezio: 'Ezio' }

/** Primo accesso: nome, piano di partenza e importazione dei giorni salvati con il vecchio selettore. */
export function Welcome({ onSave }: { onSave: (p: Profile, legacy: string[]) => Promise<string | null> }) {
  const [nome, setNome] = useState('')
  const [start, setStart] = useState<keyof typeof starts>('riferimento')
  const [legacy, setLegacy] = useState<string[]>([])
  const [importa, setImporta] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void legacyAvailable().then(setLegacy)
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(await onSave({ nome: nome.trim(), piano: starts[start].piano }, importa ? [importa] : []))
    setBusy(false)
  }

  return (
    <main className="auth">
      <h1>Iniziamo</h1>
      <p>Due scelte e il tuo menu è pronto. I fabbisogni li puoi cambiare quando vuoi da "Il mio piano".</p>

      <form className="auth__form" onSubmit={submit}>
        <label>
          Il tuo nome
          <input required maxLength={60} autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>

        <fieldset className="auth__choices">
          <legend>Da quale piano parti</legend>
          {Object.entries(starts).map(([key, s]) => (
            <label key={key} className="auth__choice">
              <input type="radio" name="start" checked={start === key} onChange={() => setStart(key as keyof typeof starts)} />
              <span>
                {s.label}
                <small>{s.hint}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {legacy.length > 0 && (
          <fieldset className="auth__choices">
            <legend>Giorni già salvati</legend>
            {legacy.map((l) => (
              <label key={l} className="auth__choice">
                <input type="checkbox" checked={importa === l} onChange={() => setImporta(importa === l ? null : l)} />
                <span>
                  Importa i giorni di {legacyNames[l] ?? l}
                  <small>Solo se sono i tuoi: si possono importare una volta sola.</small>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {message && (
          <p className="auth__message" role="alert">
            {message}
          </p>
        )}
        <button type="submit" className="button button--primary" disabled={busy}>
          Apri il mio menu
        </button>
      </form>
    </main>
  )
}
