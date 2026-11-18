import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListOrdered, CirclePlus, LayoutTemplate, Images, Settings, LogOut, Menu, X } from 'lucide-react'
import { Brand } from './Brand'
import { displayName, useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contadores', label: 'Meus Contadores', icon: ListOrdered },
  { to: '/criar', label: 'Criar Contador', icon: CirclePlus },
  { to: '/modelos', label: 'Modelos', icon: LayoutTemplate },
  { to: '/biblioteca', label: 'Biblioteca', icon: Images },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="Menu principal">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to} to={to} onClick={onNavigate}
          className={({ isActive }) => cn(
            'flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors duration-150',
            isActive ? 'border border-gold-dim bg-gold-soft font-medium text-gold' : 'border border-transparent text-white/80 hover:bg-white/[0.04] hover:text-white',
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])

  return (
    <div className="min-h-screen bg-ink">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-ink-900 lg:flex">
        <div className="border-b border-white/[0.06] px-4 py-4"><Brand to="/dashboard" /></div>
        <NavItems />
        <div className="mt-auto border-t border-white/[0.06] px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">EFC Tecnologia</div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/[0.06] bg-ink-900 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <Brand to="/dashboard" />
              <button onClick={() => setOpen(false)} className="rounded-md p-2 text-muted hover:text-white" aria-label="Fechar menu"><X className="h-5 w-5" /></button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <div className="mt-auto border-t border-white/[0.06] px-4 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">EFC Tecnologia</div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.06] bg-ink/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="-ml-1 rounded-md p-2 text-white" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
          <Brand to="/dashboard" compact />
          <span className="font-display text-sm font-bold text-gold">EFC COUNTDOWN</span>
        </div>
        <Outlet />
        <footer className="border-t border-white/[0.06] px-6 py-5 text-center text-xs text-muted" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          EFC COUNTDOWN · desenvolvido por EFC Tecnologia · <span className="text-white/60">by: efcsys</span>
        </footer>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  return (
    <header className="flex flex-col gap-4 border-b border-white/[0.06] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden text-right leading-tight sm:block">
          <div className="max-w-[160px] truncate text-sm font-semibold">{displayName(user)}</div>
          <div className="max-w-[160px] truncate text-[11px] text-muted">{user?.email}</div>
        </div>
        <button
          onClick={async () => { await signOut(); nav('/auth') }}
          className="grid h-10 w-10 place-items-center rounded-lg text-white/80 hover:bg-white/5 hover:text-white" aria-label="Sair da conta" title="Sair"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  )
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('px-4 py-6 sm:px-6 lg:px-8 animate-fade-in', className)}>{children}</main>
}
