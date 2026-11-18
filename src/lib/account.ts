import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { setStoreUser } from './planStore'
import { pullAll } from './sync'
import { pianoRiferimento, type Piano } from '../data/piano'

/**
 * Account e profilo dell'utente. Con Supabase: login con email e password,
 * profilo (nome e piano) nella tabella `profiles`. Senza Supabase
 * (sviluppo, test) l'app gira in locale con un solo utente.
 */
export interface Profile {
  nome: string
  piano: Piano
}

export type Session = { userId: string; email: string } | null

const LOCAL: NonNullable<Session> = { userId: 'locale', email: '' }
const cacheKey = (uid: string) => `weekly-plan:${uid}:profile`

/** Sessione corrente; `undefined` finché non è nota. */
export function useSession(): Session | undefined {
  const [session, setSession] = useState<Session | undefined>(() => (supabase ? undefined : enter(LOCAL)))
  useEffect(() => {
    if (!supabase) return
    const apply = (s: { user: { id: string; email?: string } } | null) =>
      setSession(s ? enter({ userId: s.user.id, email: s.user.email ?? '' }) : null)
    void supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => apply(s))
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}

function enter(s: NonNullable<Session>) {
  setStoreUser(s.userId)
  return s
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (!supabase) return null
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? authMessage(error.message) : null
}

/** Crea l'account; restituisce un messaggio se serve confermare l'email o c'è un errore. */
export async function signUp(email: string, password: string): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${location.origin}${import.meta.env.BASE_URL}` },
  })
  if (error) return authMessage(error.message)
  return data.session ? null : 'Account creato. Conferma l’indirizzo dal link che ti abbiamo mandato via email, poi accedi.'
}

export async function signOut() {
  await supabase?.auth.signOut()
}

function authMessage(msg: string): string {
  if (/invalid login/i.test(msg)) return 'Email o password non corretti.'
  if (/already registered/i.test(msg)) return 'Esiste già un account con questa email: accedi.'
  if (/password/i.test(msg)) return 'La password deve avere almeno 6 caratteri.'
  if (/email not confirmed/i.test(msg)) return 'Conferma prima l’indirizzo email dal link ricevuto.'
  return 'Non è stato possibile completare l’accesso. Riprova tra poco.'
}

function readCache(uid: string): Profile | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid))
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

function writeCache(uid: string, p: Profile) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(p))
  } catch {
    // solo cache
  }
}

/** Profilo dell'utente: `undefined` mentre si carica, `null` se non esiste ancora. */
export function useProfile(uid: string) {
  const [profile, setProfile] = useState<Profile | null | undefined>(() => readCache(uid) ?? undefined)
  useEffect(() => {
    if (!supabase) {
      setProfile(readCache(uid))
      return
    }
    let alive = true
    void supabase
      .from('profiles')
      .select('nome, piano')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) return setProfile((p) => p ?? readCache(uid)) // offline: resta la copia locale
        const p = data ? { nome: data.nome as string, piano: { ...pianoRiferimento, ...(data.piano as Piano) } } : null
        if (p) writeCache(uid, p)
        setProfile(p)
      })
    return () => {
      alive = false
    }
  }, [uid])

  const upsert = async (p: Profile) =>
    !supabase ||
    !(await supabase.from('profiles').upsert({ id: uid, nome: p.nome, piano: p.piano, updated_at: new Date().toISOString() }))
      .error

  /** Salva nome e piano; restituisce un messaggio se il database non risponde. */
  async function save(p: Profile): Promise<string | null> {
    writeCache(uid, p)
    setProfile(p)
    return (await upsert(p)) ? null : 'Salvato su questo dispositivo, ma non nel database. Riprova quando sei online.'
  }

  /** Primo accesso: crea il profilo e importa i giorni dei vecchi profili scelti. */
  async function create(p: Profile, legacy: string[]): Promise<string | null> {
    if (!(await upsert(p))) return 'Non è stato possibile creare il profilo. Controlla la connessione e riprova.'
    try {
      for (const l of legacy) await claimLegacy(l)
    } catch {
      return 'Profilo creato, ma l’importazione dei giorni non è riuscita. Riprova.'
    }
    await pullAll()
    writeCache(uid, p)
    setProfile(p)
    return null
  }

  return { profile, save, create }
}

/** Profili del vecchio selettore (Ezio, Arianna) con giorni ancora da importare. */
export async function legacyAvailable(): Promise<string[]> {
  if (!supabase) return []
  const { data } = await supabase.rpc('legacy_profiles_available')
  return (data as string[] | null) ?? []
}

/** Importa nel proprio account i giorni salvati con il vecchio profilo; restituisce quanti. */
async function claimLegacy(profile: string): Promise<number> {
  if (!supabase) return 0
  const { data, error } = await supabase.rpc('claim_legacy_profile', { p: profile })
  if (error) throw error
  return (data as number) ?? 0
}
