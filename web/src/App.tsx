import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/AppLayout'
import { supabaseConfigured } from '@/lib/supabase'

const Landing = lazy(() => import('@/pages/Landing'))
const AuthPage = lazy(() => import('@/pages/Auth'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Counters = lazy(() => import('@/pages/Counters'))
const Create = lazy(() => import('@/pages/Create'))
const Editor = lazy(() => import('@/pages/Editor'))
const Templates = lazy(() => import('@/pages/Templates'))
const Library = lazy(() => import('@/pages/Library'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const DEMO = import.meta.env.VITE_DEMO === '1'
const Router = DEMO ? MemoryRouter : BrowserRouter

function DemoBadge() {
  if (!DEMO) return null
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[60] rounded-full border border-gold-dim bg-black/85 px-3 py-1.5 text-[11px] font-semibold text-gold shadow-card backdrop-blur">
      Modo demonstração · dados de exemplo
    </div>
  )
}

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink">
      <img src={`${import.meta.env.BASE_URL}logo-efc.webp`} style={{ mixBlendMode: 'lighten' }} alt="EFC Tecnologia" width={160} className="w-40 animate-pulse opacity-90" />
    </div>
  )
}

function EditorRoute() {
  const loc = useLocation()
  // mantém o mesmo editor quando um contador novo é salvo e a rota muda de /criar/x para /contadores/:id
  const key = (loc.state as { editorKey?: string } | null)?.editorKey ?? loc.pathname
  return <Editor key={key} />
}

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />
  return <>{children}</>
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <Splash />
  if (session) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-md p-6">
          <h1 className="font-display text-lg font-bold text-gold">Configuração pendente</h1>
          <p className="mt-2 text-sm text-muted">Defina SUPABASE_URL e SUPABASE_ANON_KEY no servidor para usar o EFC Countdown.</p>
        </div>
      </div>
    )
  }
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<Splash />}>
            <Routes>
              <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
              <Route path="/auth" element={<PublicOnly><AuthPage /></PublicOnly>} />
              <Route path="/redefinir-senha" element={<ResetPassword />} />
              <Route element={<Protected><AppLayout /></Protected>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/contadores" element={<Counters />} />
                <Route path="/contadores/:id" element={<EditorRoute />} />
                <Route path="/criar" element={<Create />} />
                <Route path="/criar/:type" element={<EditorRoute />} />
                <Route path="/modelos" element={<Templates />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
        <DemoBadge />
        <Toaster theme="dark" position="top-center" richColors toastOptions={{ style: { background: '#111', border: '1px solid rgba(212,175,55,0.25)' } }} />
      </AuthProvider>
    </QueryClientProvider>
  )
}
