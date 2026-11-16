import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Finché VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY non sono impostate
 * (vedi README), l'app gira solo con stato locale in memoria — utile per
 * sviluppare la UI prima di avere un progetto Supabase pronto.
 */
export const supabaseEnabled = Boolean(url && anonKey)

export const supabase = supabaseEnabled ? createClient(url as string, anonKey as string) : null
