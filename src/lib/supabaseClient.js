// Supabase client (optional). Works when Vite env vars are set.
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, optional VITE_SUPABASE_SCHEMA
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// Default to the dedicated `productivity` schema so app data is isolated.
// You can override by setting VITE_SUPABASE_SCHEMA in your env.
const schema = import.meta.env.VITE_SUPABASE_SCHEMA || 'productivity'

export const supabase = url && key ? createClient(url, key, { db: { schema } }) : null
export const hasSupabase = !!supabase
export const configuredSchema = schema
