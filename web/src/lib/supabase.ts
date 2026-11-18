import { createClient } from '@supabase/supabase-js'

const env = window.__ENV ?? {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  PUBLIC_URL: window.location.origin,
}

export const PUBLIC_URL = (env.PUBLIC_URL || window.location.origin).replace(/\/$/, '')
export const supabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY)

export const supabase = createClient(env.SUPABASE_URL || 'http://localhost', env.SUPABASE_ANON_KEY || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
