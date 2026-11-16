import { createClient } from '@supabase/supabase-js'

// Fuori da Vite (es. test in Node) import.meta.env non esiste.
const env = typeof import.meta.env !== 'undefined' ? import.meta.env : undefined
const url = env?.VITE_SUPABASE_URL as string | undefined
const anonKey = env?.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Finché VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY non sono impostate
 * (secrets GitHub per il deploy, .env.local in sviluppo), l'app salva
 * solo sul dispositivo (localStorage); con le chiavi, src/lib/sync.ts
 * sincronizza i giorni con la tabella day_plans.
 */
export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled ? createClient(url as string, anonKey as string) : null
