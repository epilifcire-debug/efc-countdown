import { BarChart3, Clock, Gauge, Siren } from 'lucide-react'
import type { CounterType } from '@shared/render.js'

export function TypeIcon({ type, className = 'h-5 w-5' }: { type: CounterType; className?: string }) {
  const Icon = { countdown: Clock, percentage: Gauge, progress: BarChart3, alert: Siren }[type] ?? Clock
  return <Icon className={className} aria-hidden />
}
