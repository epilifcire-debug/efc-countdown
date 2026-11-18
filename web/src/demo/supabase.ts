// Stub de '@/lib/supabase' para o modo demonstração.
type Listener = (event: string, session: unknown) => void
const listeners = new Set<Listener>()
const user = { id: '00000000-0000-4000-8000-000000000001', email: 'demo@efcsys.com', created_at: '2026-08-01T12:00:00Z', user_metadata: { full_name: 'Eric Filipe' } }
let session: unknown = null // começa deslogado: o preview mostra landing → login → app
const ok = <T,>(data: T) => Promise.resolve({ data, error: null })

export const PUBLIC_URL = 'https://countdown.efcsys.com'
export const supabaseConfigured = true
export const supabase = {
  auth: {
    getSession: () => ok({ session }),
    onAuthStateChange: (cb: Listener) => { listeners.add(cb); return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } } },
    signInWithPassword: () => { session = { access_token: 'demo', user }; listeners.forEach((l) => l('SIGNED_IN', session)); return ok({ session }) },
    signUp: () => { session = { access_token: 'demo', user }; listeners.forEach((l) => l('SIGNED_IN', session)); return ok({ session }) },
    signInWithOAuth: () => { session = { access_token: 'demo', user }; listeners.forEach((l) => l('SIGNED_IN', session)); return ok({}) },
    resetPasswordForEmail: () => ok({}),
    updateUser: () => ok({ user }),
    signOut: () => { session = null; listeners.forEach((l) => l('SIGNED_OUT', null)); return Promise.resolve({ error: null }) },
  },
}
