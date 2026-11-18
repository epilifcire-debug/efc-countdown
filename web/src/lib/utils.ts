import { clsx, type ClassValue } from 'clsx'
import { toast } from 'sonner'
import { withDefaults } from '@shared/render.js'
import type { Countdown, Status } from './types'

export const cn = (...v: ClassValue[]) => clsx(v)

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '—'

export const fmtDateTime = (iso?: string | null, tz = 'America/Sao_Paulo') =>
  iso ? new Date(iso).toLocaleString('pt-BR', { timeZone: tz, dateStyle: 'short', timeStyle: 'short' }) : '—'

export const fmtSize = (b?: number | null) => (b == null ? '—' : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`)

export async function copy(text: string, what = 'Copiado') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${what}!`)
  } catch {
    toast.error('Não foi possível copiar. Selecione e copie manualmente.')
  }
}

/** Status exibido: contagem passada aparece como expirada mesmo antes do job do servidor. */
export function effectiveStatus(c: Pick<Countdown, 'status' | 'type' | 'target_at'>): Status {
  if (c.type === 'countdown' && c.status === 'active' && c.target_at && new Date(c.target_at).getTime() <= Date.now()) return 'expired'
  return c.status
}

/** Settings completos para renderizar uma linha do banco. */
export function rowSettings(c: Countdown) {
  return withDefaults(c.type, {
    ...c.settings,
    title: c.title ?? c.settings?.title ?? '',
    subtitle: c.subtitle ?? c.settings?.subtitle ?? '',
    targetAt: c.target_at,
    value: c.percentage ?? c.settings?.value,
    current: c.current_value ?? c.settings?.current,
    max: c.max_value ?? c.settings?.max,
  })
}

export function htmlSnippet(url: string, maxWidth: string, alt: string) {
  const mw = maxWidth === '100%' ? '100%' : maxWidth
  return `<div style="text-align:center">\n  <img src="${url}" style="width:100%;max-width:${mw};height:auto;" alt="${alt.replace(/"/g, '&quot;')}" />\n</div>`
}
