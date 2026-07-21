import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as variáveis, o app roda em modo mock (sem banco).
export const hasSupabase = Boolean(url && key)
export const supabase = hasSupabase ? createClient(url, key) : null

// Cliente auxiliar: usado pelo admin para criar contas sem derrubar a própria sessão.
export function makeAuxClient() {
  if (!hasSupabase) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: 'pwr-aux' },
  })
}