import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Quando as variáveis não estão definidas, o app roda no modo mock (sem banco).
export const hasSupabase = Boolean(url && key)
export const supabase = hasSupabase ? createClient(url, key) : null