import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Status } from '@/lib/types'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'danger-ghost'

export function Button({
  variant = 'outline', size = 'md', loading, className, children, disabled, ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }) {
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center whitespace-nowrap justify-center gap-2 rounded-lg font-medium transition-all duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        variant === 'primary' && 'bg-gold font-semibold text-black hover:bg-gold-light',
        variant === 'outline' && 'border border-white/10 bg-ink-800 text-white hover:border-gold/60 hover:text-gold-light',
        variant === 'ghost' && 'text-white/80 hover:bg-white/5 hover:text-white',
        variant === 'danger' && 'bg-danger font-semibold text-white hover:brightness-110',
        variant === 'danger-ghost' && 'text-danger hover:bg-danger/10',
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function Field({ label, hint, error, children, className }: { label?: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

export function Input({ label, hint, error, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={p.id || id} className="label">{label}</label>}
      <input id={p.id || id} {...p} aria-invalid={Boolean(error)} className={cn('field', error && 'border-danger')} />
      {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

export function Select({ label, hint, options, className, ...p }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: string; options: { value: string; label: string }[] }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <select id={id} {...p} className="field appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%23A1A1A1%22 fill=%22none%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  const valid = /^#[0-9a-f]{6}$/i.test(value)
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-ink-800 px-2 focus-within:border-gold">
        <input id={id} type="color" value={valid ? value : '#000000'} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-7 w-9 shrink-0 cursor-pointer rounded-md bg-transparent" aria-label={`${label} — seletor`} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) onChange((v.startsWith('#') ? v : `#${v}`).toUpperCase()) }}
          maxLength={7}
          className="w-full bg-transparent font-mono text-sm uppercase text-white focus:outline-none"
          aria-label={`${label} — código hexadecimal`}
        />
      </div>
    </div>
  )
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-2.5">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="hint block">{hint}</span>}
      </span>
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-150', checked ? 'bg-gold' : 'bg-white/15')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </label>
  )
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label?: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div role="radiogroup" className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-ink-800 p-1">
        {options.map((o) => (
          <button
            key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
            className={cn('min-h-9 flex-1 whitespace-nowrap rounded-md px-3 text-sm transition-colors duration-150', value === o.value ? 'bg-gold font-semibold text-black' : 'text-white/75 hover:bg-white/5 hover:text-white')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  active: { label: 'Ativo', cls: 'border-gold/50 text-gold' },
  expired: { label: 'Expirado', cls: 'border-danger/60 text-danger' },
  draft: { label: 'Rascunho', cls: 'border-white/20 text-muted' },
  archived: { label: 'Arquivado', cls: 'border-white/15 text-white/50' },
}

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status] ?? STATUS.draft
  return <span className={cn('inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-wider', s.cls)}>{s.label}</span>
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center animate-fade-in">
      {icon && <div className="mb-4 grid h-14 w-14 place-items-center rounded-xl border border-gold-dim bg-gold-soft text-gold">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-danger/30 px-6 py-10 text-center" role="alert">
      <p className="font-medium">Algo deu errado</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && <Button className="mt-4" size="sm" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={cn('card-gold max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 outline-none animate-fade-in sm:rounded-xl sm:p-6', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="-m-1 rounded-md p-1 text-muted hover:text-white" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, text, confirmLabel = 'Excluir', onConfirm, onClose, loading }: {
  open: boolean; title: string; text: string; confirmLabel?: string; onConfirm: () => void; onClose: () => void; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{text}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
