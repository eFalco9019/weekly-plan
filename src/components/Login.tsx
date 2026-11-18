import { useState, type FormEvent } from 'react'
import { signIn, signUp } from '../lib/account'

/** Accesso con email e password, oppure creazione dell'account. */
export function Login() {
  const [mode, setMode] = useState<'accedi' | 'crea'>('accedi')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(await (mode === 'accedi' ? signIn : signUp)(email.trim(), password))
    setBusy(false)
  }

  return (
    <main className="auth">
      <h1>
        Energia nei giorni ON.
        <br />
        Recupero nei giorni OFF.
      </h1>
      <p>{mode === 'accedi' ? 'Accedi per aprire il tuo piano.' : 'Crea il tuo account: il piano lo imposti subito dopo.'}</p>

      <form className="auth__form" onSubmit={submit}>
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === 'accedi' ? 'current-password' : 'new-password'}
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {message && (
          <p className="auth__message" role="alert">
            {message}
          </p>
        )}
        <button type="submit" className="button button--primary" disabled={busy}>
          {mode === 'accedi' ? 'Accedi' : 'Crea account'}
        </button>
      </form>

      <button
        type="button"
        className="link-button"
        onClick={() => {
          setMode(mode === 'accedi' ? 'crea' : 'accedi')
          setMessage(null)
        }}
      >
        {mode === 'accedi' ? 'Non hai un account? Creane uno' : 'Hai già un account? Accedi'}
      </button>
    </main>
  )
}
