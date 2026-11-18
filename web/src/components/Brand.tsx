import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Brand({ to = '/', compact, className }: { to?: string; compact?: boolean; className?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-3', className)} aria-label="EFC Countdown">
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-gold-dim bg-black">
        <img src={`${import.meta.env.BASE_URL}logo-efc.webp`} alt="" width={40} height={40} className="h-full w-full scale-[1.35] object-contain" />
      </span>
      {!compact && (
        <span className="whitespace-nowrap leading-tight">
          <span className="block font-display text-[15px] font-bold tracking-wide text-gold">EFC COUNTDOWN</span>
          <span className="block text-[11px] text-muted">by EFC Tecnologia</span>
        </span>
      )}
    </Link>
  )
}
