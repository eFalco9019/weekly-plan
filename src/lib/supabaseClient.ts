import { createClient } from '@supabase/supabase-js'

// Fuori da Vite (es. test in Node) import.meta.env non esiste.
const env = typeof import.meta.env !== 'undefined' ? import.meta.env : undefined
const url = env?.VITE_SUPABASE_URL as string | undefined
const anonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Con VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (.env.production, chiave
 * pubblica) l'app usa login e database; senza (sviluppo, test) gira in
 * locale su questo dispositivo.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
