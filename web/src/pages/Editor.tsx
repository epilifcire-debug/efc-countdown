import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, ChevronDown, Save, Sparkles, TriangleAlert } from 'lucide-react'
import {
  ALERT_ICONS, BLINK_STYLES, BLINK_TARGETS, DIMENSION_PRESETS, FONTS, MAX_BLINK_HZ, PERCENT_STYLES, TYPES, TYPE_LABELS,
  pct, withDefaults, zonedToUtc, type CounterType, type Settings,
} from '@shared/render.js'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { Button, ColorPicker, ErrorState, Field, Input, Segmented, Select, Skeleton, StatusBadge, Toggle } from '@/components/ui'
import { CounterCanvas, PreviewStage } from '@/components/CounterCanvas'
import { GifResultModal } from '@/components/GifResultModal'
import { TypeIcon } from '@/components/TypeIcon'
import { useTemplates } from '@/hooks/useCounters'
import { generateGif, getCountdown, getTemplate, saveCountdown, type CountdownInput } from '@/lib/api'
import { cn, effectiveStatus } from '@/lib/utils'
import type { Countdown, GifResult, Status } from '@/lib/types'

const TIMEZONES = [
  ['America/Sao_Paulo', 'Brasília (São Paulo, Rio, Aracaju)'], ['America/Bahia', 'Salvador'], ['America/Fortaleza', 'Fortaleza'],
  ['America/Recife', 'Recife'], ['America/Belem', 'Belém'], ['America/Manaus', 'Manaus'], ['America/Cuiaba', 'Cuiabá'],
  ['America/Rio_Branco', 'Rio Branco'], ['America/Noronha', 'Fernando de Noronha'], ['UTC', 'UTC'],
  ['Europe/Lisbon', 'Lisboa'], ['America/New_York', 'Nova York'],
].map(([value, label]) => ({ value, label }))

const QUALITY = {
  pequeno: { label: 'Pequeno', fps: 12, frames: 30 },
  medio: { label: 'Médio', fps: 20, frames: 60 },
  grande: { label: 'Grande', fps: 30, frames: 90 },
} as const

const WEIGHTS = [400, 500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: { 400: 'Regular', 500: 'Médio', 600: 'Semibold', 700: 'Negrito', 800: 'Extra negrito', 900: 'Black' }[w]! }))

function todayIn(tz: string, addDays = 0) {
  const d = new Date(Date.now() + addDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="card">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-4 text-left" aria-expanded={open}>
        <h2 className="eyebrow text-white">{title}</h2>
        <ChevronDown className={cn('h-4 w-4 text-muted transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-4 border-t border-white/[0.06] px-5 pb-5 pt-4">{children}</div>}
    </section>
  )
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>

function Range({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between"><span className="text-sm font-medium">{label}</span><span className="font-mono text-xs text-gold">{value}{unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#D4AF37]" aria-label={label} />
    </div>
  )
}

export default function Editor() {
  const { id, type: typeParam } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const loc = useLocation()
  const qc = useQueryClient()
  const templates = useTemplates()

  const [row, setRow] = useState<Countdown | null>(null)
  const [type, setType] = useState<CounterType>((TYPES.includes(typeParam as CounterType) ? typeParam : 'countdown') as CounterType)
  const [name, setName] = useState('')
  const [s, setS] = useState<Settings>(() => withDefaults(type))
  const [date, setDate] = useState(todayIn('America/Sao_Paulo', 7))
  const [time, setTime] = useState('10:00')
  const [tz, setTz] = useState('America/Sao_Paulo')
  const [status, setStatus] = useState<Status>('draft')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GifResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  // Carregar contador existente ou modelo
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (id && row?.id === id) return
        if (id) {
          const c = await getCountdown(id)
          if (!alive) return
          setRow(c); setType(c.type); setName(c.name); setStatus(c.status); setTemplateId(c.template_id)
          setS(withDefaults(c.type, { ...c.settings, title: c.title ?? c.settings?.title, subtitle: c.subtitle ?? c.settings?.subtitle, value: c.percentage ?? c.settings?.value, current: c.current_value ?? c.settings?.current, max: c.max_value ?? c.settings?.max }))
          if (c.target_date) setDate(c.target_date)
          if (c.target_time) setTime(c.target_time.slice(0, 5))
          if (c.timezone) setTz(c.timezone)
        } else {
          const tid = params.get('modelo')
          const t = tid ? await getTemplate(tid) : null
          if (!alive) return
          if (t) { setS(withDefaults(type, t.settings)); setTemplateId(t.id) }
        }
      } catch (e) {
        setLoadError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const set = (patch: Settings) => { setS((prev: Settings) => withDefaults(type, { ...prev, ...patch })); setDirty(true) }
  const targetAt = useMemo(() => (type === 'countdown' ? zonedToUtc(date, time, tz) : null), [type, date, time, tz])
  const preview = useMemo(() => ({ ...s, targetAt }), [s, targetAt])
  const typeTemplates = (templates.data ?? []).filter((t) => t.type === type)

  const validate = () => {
    const e: Record<string, string> = {}
    if (type === 'countdown') {
      if (!date) e.date = 'Informe a data final.'
      if (!time) e.time = 'Informe a hora final.'
    }
    if (type === 'percentage' && (s.value < 0 || s.value > 100)) e.value = 'Use um valor de 0 a 100.'
    if (type === 'progress') {
      if (!(Number(s.max) > 0)) e.max = 'O valor máximo deve ser maior que zero.'
      if (Number(s.current) < 0) e.current = 'O valor atual não pode ser negativo.'
    }
    setErrors(e)
    if (Object.keys(e).length) toast.error('Revise os campos destacados.')
    return Object.keys(e).length === 0
  }

  const buildInput = (): CountdownInput => {
    const { targetAt: _t, ...settings } = s
    let nextStatus = status
    if (row?.gif_url && type === 'countdown' && (status === 'active' || status === 'expired')) {
      nextStatus = targetAt && new Date(targetAt).getTime() > Date.now() ? 'active' : 'expired'
    }
    return {
      name: (name || s.title || TYPE_LABELS[type]).trim(),
      type,
      title: s.title || null,
      subtitle: s.subtitle || null,
      settings,
      template_id: templateId,
      status: nextStatus,
      target_date: type === 'countdown' ? date : null,
      target_time: type === 'countdown' ? time : null,
      timezone: type === 'countdown' ? tz : null,
      target_at: targetAt,
      percentage: type === 'percentage' ? Number(s.value) : null,
      current_value: type === 'progress' ? Number(s.current) : null,
      max_value: type === 'progress' ? Number(s.max) : null,
    }
  }

  const persist = async () => {
    const saved = await saveCountdown(row?.id ?? null, buildInput())
    setRow(saved); setStatus(saved.status); setDirty(false)
    qc.invalidateQueries({ queryKey: ['countdowns'] })
    if (!row) nav(`/contadores/${saved.id}`, { replace: true, state: { editorKey: (loc.state as { editorKey?: string } | null)?.editorKey ?? loc.pathname } })
    return saved
  }

  const onSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const saved = await persist()
      if (saved.gif_url && saved.type !== 'countdown') {
        await generateGif(saved.id)
        qc.invalidateQueries({ queryKey: ['files'] })
        toast.success('Alterações salvas e GIF atualizado.')
      } else toast.success(saved.gif_url ? 'Alterações salvas. O GIF já reflete as mudanças.' : 'Rascunho salvo.')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const onGenerate = async () => {
    if (!validate()) return
    if (type === 'countdown' && targetAt && new Date(targetAt).getTime() <= Date.now() && s.afterEnd !== 'message') {
      toast.warning('A data final já passou: o GIF mostrará o contador zerado.')
    }
    setGenerating(true)
    try {
      const saved = await persist()
      const r = await generateGif(saved.id)
      const fresh = await getCountdown(saved.id)
      setRow(fresh); setStatus(fresh.status)
      qc.invalidateQueries({ queryKey: ['countdowns'] }); qc.invalidateQueries({ queryKey: ['files'] })
      setResult(r)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (<><PageHeader title="Carregando contador..." /><PageBody><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><Skeleton className="h-96" /><Skeleton className="h-64" /></div></PageBody></>)
  if (loadError) return (<><PageHeader title="Editar contador" /><PageBody><ErrorState message={loadError} onRetry={() => window.location.reload()} /></PageBody></>)

  const shownStatus = row ? effectiveStatus({ status, type, target_at: targetAt }) : 'draft'
  const quality = (Object.entries(QUALITY).find(([, q]) => q.fps === s.fps && (type !== 'countdown' || q.frames === s.frames))?.[0] ?? 'custom') as keyof typeof QUALITY | 'custom'

  return (
    <>
      <PageHeader
        title={row ? 'Editar contador' : `Novo: ${TYPE_LABELS[type]}`}
        subtitle={row ? row.name : 'Configure, personalize e gere o GIF.'}
        actions={<Button variant="ghost" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4" />Voltar</Button>}
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          {/* PREVIEW — fixo no topo no mobile, à direita no desktop */}
          <div className="order-first lg:order-last">
            <div className="sticky top-14 z-10 -mx-4 bg-ink/95 px-4 pb-3 pt-2 backdrop-blur lg:top-6 lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <div className="card-gold p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold"><TypeIcon type={type} className="h-4 w-4 text-gold" />Preview em tempo real</span>
                  {row && <StatusBadge status={shownStatus} />}
                </div>
                <PreviewStage className="min-h-[120px] lg:min-h-[220px]" checker={s.bgMode === 'transparent'}>
                  <CounterCanvas type={type} settings={preview} className="max-h-[30vh] w-auto lg:max-h-none" />
                </PreviewStage>
                <p className="mt-2 text-center text-xs text-muted">{s.width}×{s.height} px · o GIF final terá exatamente esta aparência</p>
                {type === 'alert' && <p className="mt-1 text-center text-[11px] text-muted">Limite de segurança: no máximo {MAX_BLINK_HZ} piscadas por segundo.</p>}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={onSave} loading={saving} disabled={generating}><Save className="h-4 w-4" />Salvar</Button>
                  <Button variant="primary" onClick={onGenerate} loading={generating} disabled={saving}><Sparkles className="h-4 w-4" />Gerar GIF</Button>
                </div>
                {dirty && <p className="mt-2 text-center text-[11px] text-gold/80">Alterações não salvas</p>}
              </div>
            </div>
          </div>

          {/* EDITOR */}
          <div className="space-y-4">
            <Section title="Configuração">
              <Input label="Nome do contador" hint="Usado só para organizar seus contadores." value={name} placeholder={s.title || 'Ex.: Pré-Caju 2026'} onChange={(e) => { setName(e.target.value); setDirty(true) }} />
              <Input label="Título" value={s.title} onChange={(e) => set({ title: e.target.value })} />
              {type !== 'percentage' && <Input label={type === 'alert' ? 'Texto secundário' : 'Texto abaixo'} value={s.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />}
              {type === 'percentage' && <Input label="Texto secundário (opcional)" value={s.subtitle} onChange={(e) => set({ subtitle: e.target.value })} hint="Aparece no estilo circular com o título ao lado." />}

              {type === 'countdown' && (
                <>
                  <Grid>
                    <Input label="Data final" type="date" value={date} onChange={(e) => { setDate(e.target.value); setDirty(true) }} error={errors.date} />
                    <Input label="Hora final" type="time" value={time} onChange={(e) => { setTime(e.target.value); setDirty(true) }} error={errors.time} />
                  </Grid>
                  <Select label="Fuso horário" value={tz} onChange={(e) => { setTz(e.target.value); setDirty(true) }} options={TIMEZONES} />
                  <Segmented label="Formato" value={s.format} onChange={(v) => set({ format: v })} options={[{ value: 'dhms', label: 'DD : HH : MM : SS' }, { value: 'hms', label: 'HH : MM : SS' }, { value: 'ms', label: 'MM : SS' }]} />
                  <Segmented label="Unidades" value={s.unitStyle} onChange={(v) => set({ unitStyle: v })} options={[{ value: 'colon', label: 'Abaixo dos números' }, { value: 'inline', label: 'Ao lado (DD DIAS)' }]} />
                  {s.unitStyle === 'colon' && <Toggle label="Mostrar nomes das unidades" checked={s.showLabels} onChange={(v) => set({ showLabels: v })} />}
                  {(s.showLabels || s.unitStyle === 'inline') && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(['d', 'h', 'm', 's'] as const).filter((k) => s.format === 'dhms' || k !== 'd').filter((k) => s.format !== 'ms' || (k !== 'h')).map((k) => (
                        <Input key={k} label={{ d: 'Dias', h: 'Horas', m: 'Minutos', s: 'Segundos' }[k]} value={s.labels[k]} onChange={(e) => set({ labels: { ...s.labels, [k]: e.target.value } })} />
                      ))}
                    </div>
                  )}
                  <Select label="Comportamento após término" value={s.afterEnd} onChange={(e) => set({ afterEnd: e.target.value })}
                    options={[{ value: 'zero', label: 'Mostrar 00:00:00:00' }, { value: 'message', label: 'Mostrar mensagem' }, { value: 'freeze', label: 'Manter último frame' }]} />
                  {s.afterEnd === 'message' && <Input label="Mensagem após o término" value={s.endMessage} onChange={(e) => set({ endMessage: e.target.value })} />}
                </>
              )}

              {type === 'percentage' && (
                <>
                  <div className="grid grid-cols-[1fr_96px] items-end gap-3">
                    <Range label="Porcentagem" value={Number(s.value)} min={0} max={100} unit="%" onChange={(v) => set({ value: v })} />
                    <Input aria-label="Porcentagem" type="number" min={0} max={100} value={s.value} onChange={(e) => set({ value: Math.max(0, Math.min(100, Number(e.target.value))) })} error={errors.value} />
                  </div>
                  <Field label="Estilo">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PERCENT_STYLES.map((o) => (
                        <button key={o.key} type="button" onClick={() => set({ style: o.key })}
                          className={cn('rounded-lg border p-2 text-xs transition-colors duration-150', s.style === o.key ? 'border-gold bg-gold-soft text-gold' : 'border-white/10 bg-ink-800 text-white/80 hover:border-white/25')}>
                          <span className="pointer-events-none block"><CounterCanvas type="percentage" animate={false} settings={{ ...s, style: o.key, width: 160, height: o.key.startsWith('circle') ? 90 : 70, borderWidth: 1, padding: 6 }} /></span>
                          <span className="mt-1.5 block font-medium">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}

              {type === 'progress' && (
                <>
                  <Grid>
                    <Input label="Valor atual" type="number" min={0} value={s.current} onChange={(e) => set({ current: Number(e.target.value) })} error={errors.current} />
                    <Input label="Valor máximo" type="number" min={1} value={s.max} onChange={(e) => set({ max: Number(e.target.value) })} error={errors.max} />
                  </Grid>
                  <p className="rounded-lg border border-gold-dim bg-gold-soft px-3 py-2 text-sm text-gold">Calculado automaticamente: {s.current} / {s.max} = {Math.round(pct(s.current, s.max))}%</p>
                  <Grid>
                    <Toggle label="Mostrar valores" hint={`${s.current} / ${s.max}`} checked={s.showValues} onChange={(v) => set({ showValues: v })} />
                    <Toggle label="Mostrar porcentagem" checked={s.showPercent} onChange={(v) => set({ showPercent: v })} />
                  </Grid>
                </>
              )}

              {type === 'alert' && (
                <>
                  <Field label="Ícone">
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {ALERT_ICONS.map((o) => (
                        <button key={o.key} type="button" title={o.label} onClick={() => set({ icon: o.key })}
                          className={cn('flex flex-col items-center gap-1 rounded-lg border p-2 text-[11px] transition-colors duration-150', s.icon === o.key ? 'border-gold bg-gold-soft text-gold' : 'border-white/10 bg-ink-800 text-white/80 hover:border-white/25')}>
                          {o.key === 'none' ? <span className="grid h-10 place-items-center text-muted">—</span> : <span className="pointer-events-none"><CounterCanvas type="alert" animate={false} settings={{ ...s, icon: o.key, iconPosition: 'only', width: 40, height: 40, borderWidth: 0, padding: 2, bgMode: 'transparent' }} /></span>}
                          <span className="leading-tight">{o.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  {s.icon !== 'none' && <Segmented label="Posição do ícone" value={s.iconPosition} onChange={(v) => set({ iconPosition: v })} options={[{ value: 'left', label: 'À esquerda' }, { value: 'top', label: 'Acima' }, { value: 'only', label: 'Só o ícone' }]} />}
                </>
              )}
            </Section>

            {typeTemplates.length > 0 && (
              <Section title="Modelos visuais" defaultOpen={!row}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {typeTemplates.map((t) => (
                    <button key={t.id} type="button"
                      onClick={() => { setS((prev: Settings) => withDefaults(type, { ...prev, ...t.settings, title: prev.title, subtitle: prev.subtitle, value: prev.value, current: prev.current, max: prev.max, width: t.settings.width ?? prev.width, height: t.settings.height ?? prev.height })); setTemplateId(t.id); setDirty(true); toast.success(`Modelo “${t.name}” aplicado.`) }}
                      className={cn('rounded-lg border p-2 text-left text-xs transition-colors duration-150', templateId === t.id ? 'border-gold bg-gold-soft' : 'border-white/10 bg-ink-800 hover:border-white/25')}>
                      <span className="pointer-events-none block"><CounterCanvas type={type} animate={false} settings={{ ...s, ...t.settings, title: s.title, subtitle: s.subtitle, targetAt, width: 200, height: 70 }} /></span>
                      <span className={cn('mt-1.5 block font-semibold', templateId === t.id && 'text-gold')}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Aparência">
              <Segmented label="Fundo" value={s.bgMode === 'transparent' ? 'transparent' : s.bgColor === '#000000' ? 'black' : s.bgColor === '#FFFFFF' ? 'white' : 'custom'}
                onChange={(v) => set(v === 'transparent' ? { bgMode: 'transparent' } : v === 'black' ? { bgMode: 'color', bgColor: '#000000' } : v === 'white' ? { bgMode: 'color', bgColor: '#FFFFFF' } : { bgMode: 'color', bgColor: s.bgColor === '#000000' || s.bgColor === '#FFFFFF' ? '#141414' : s.bgColor })}
                options={[{ value: 'transparent', label: 'Transparente' }, { value: 'black', label: 'Preto' }, { value: 'white', label: 'Branco' }, { value: 'custom', label: 'Personalizado' }]} />
              {s.bgMode === 'transparent' ? (
                <ColorPicker label="Cor do site onde o GIF será usado" value={s.matteColor} onChange={(v) => set({ matteColor: v })} />
              ) : (
                <ColorPicker label="Cor do fundo" value={s.bgColor} onChange={(v) => set({ bgColor: v })} />
              )}
              {s.bgMode === 'transparent' && <p className="hint -mt-2">GIF só tem transparência total ou nenhuma: informe a cor do site para as bordas do texto ficarem suaves.</p>}
              <Grid>
                <ColorPicker label="Cor do título" value={s.titleColor} onChange={(v) => set({ titleColor: v })} />
                <ColorPicker label={type === 'alert' ? 'Cor do texto secundário' : 'Cor do texto abaixo'} value={s.subtitleColor} onChange={(v) => set({ subtitleColor: v })} />
                {type !== 'alert' && <ColorPicker label="Cor dos números" value={s.numberColor} onChange={(v) => set({ numberColor: v })} />}
                {type === 'countdown' && <ColorPicker label="Cor das unidades" value={s.labelColor} onChange={(v) => set({ labelColor: v })} />}
                {(type === 'percentage' || type === 'progress') && <ColorPicker label="Cor de destaque (barra/círculo)" value={s.accentColor} onChange={(v) => set({ accentColor: v })} />}
                {(type === 'percentage' || type === 'progress') && <ColorPicker label="Cor do trilho" value={s.trackColor} onChange={(v) => set({ trackColor: v })} />}
                {type === 'alert' && <ColorPicker label="Cor do ícone" value={s.iconColor} onChange={(v) => set({ iconColor: v })} />}
                <ColorPicker label="Cor da borda" value={s.borderColor} onChange={(v) => set({ borderColor: v })} />
              </Grid>
              <Grid>
                <Range label="Espessura da borda" value={s.borderWidth} min={0} max={10} unit="px" onChange={(v) => set({ borderWidth: v })} />
                <Range label="Cantos arredondados" value={s.radius} min={0} max={40} unit="px" onChange={(v) => set({ radius: v })} />
              </Grid>
              <Grid>
                <Select label="Fonte" value={s.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} options={FONTS.map((f) => ({ value: f.key, label: f.label }))} />
                <Select label="Peso da fonte" value={String(s.fontWeight)} onChange={(e) => set({ fontWeight: Number(e.target.value) })} options={WEIGHTS} />
              </Grid>
              <Grid>
                <Range label="Espaçamento entre letras" value={s.letterSpacing} min={0} max={12} onChange={(v) => set({ letterSpacing: v })} />
                <Range label="Margem interna" value={s.padding} min={0} max={40} unit="px" onChange={(v) => set({ padding: v })} />
              </Grid>
              <Segmented label="Alinhamento" value={s.align} onChange={(v) => set({ align: v })} options={[{ value: 'left', label: 'Esquerda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Direita' }]} />
            </Section>

            {type === 'alert' && (
              <Section title="Piscada do alerta">
                <Select label="Estilo de piscada" value={s.blinkStyle} onChange={(e) => set({ blinkStyle: e.target.value })} options={BLINK_STYLES.map((b) => ({ value: b.key, label: b.label }))} />
                {s.blinkStyle !== 'border' && (
                  <Field label="O que pisca">
                    <div className="flex flex-wrap gap-2">
                      {BLINK_TARGETS.filter((t) => s.blinkStyle !== 'glow' || t.key !== 'background').map((t) => {
                        const on = (s.blinkTargets as string[]).includes(t.key)
                        return (
                          <button key={t.key} type="button" aria-pressed={on}
                            onClick={() => set({ blinkTargets: on ? s.blinkTargets.filter((x: string) => x !== t.key) : [...s.blinkTargets, t.key] })}
                            className={cn('h-9 rounded-full border px-3 text-sm transition-colors duration-150', on ? 'border-gold bg-gold-soft text-gold' : 'border-white/10 text-white/75 hover:border-white/25')}>
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                )}
                <Grid>
                  <ColorPicker label="Cor do alerta (A)" value={s.colorA} onChange={(v) => set({ colorA: v })} />
                  {s.blinkStyle === 'alternate' && <ColorPicker label="Cor alternada (B)" value={s.colorB} onChange={(v) => set({ colorB: v })} />}
                  {s.blinkStyle === 'glow' && <ColorPicker label="Cor do brilho" value={s.glowColor} onChange={(v) => set({ glowColor: v })} />}
                </Grid>
                {s.blinkStyle === 'glow' && <Range label="Intensidade do brilho" value={s.glowIntensity} min={0} max={100} unit="%" onChange={(v) => set({ glowIntensity: v })} />}
                <Segmented label="Velocidade" value={String(s.speed)} onChange={(v) => set({ speed: Number(v) })}
                  options={[{ value: '1', label: 'Lenta · 1/s' }, { value: '2', label: 'Média · 2/s' }, { value: '3', label: 'Rápida · 3/s' }]} />
                <p className="flex items-start gap-2 text-xs text-muted"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />Para proteger pessoas com fotossensibilidade, o máximo é {MAX_BLINK_HZ} piscadas por segundo.</p>
                <Grid>
                  <Range label="Pausa entre ciclos" value={s.pauseMs} min={0} max={3000} step={100} unit=" ms" onChange={(v) => set({ pauseMs: v })} />
                  {s.pauseMs > 0 && <Range label="Piscadas antes da pausa" value={s.blinksPerCycle} min={1} max={10} onChange={(v) => set({ blinksPerCycle: v })} />}
                </Grid>
                <Segmented label="Repetição" value={s.loop === false ? 'once' : 'loop'} onChange={(v) => set({ loop: v === 'loop' })} options={[{ value: 'loop', label: 'Loop infinito' }, { value: 'once', label: 'Executar uma vez' }]} />
              </Section>
            )}

            {(type === 'percentage' || type === 'progress') && (
              <Section title="Animação">
                <Range label="Duração da animação" value={s.duration} min={500} max={8000} step={100} unit=" ms" onChange={(v) => set({ duration: v })} />
                <Segmented label="Repetição" value={s.loop ? 'loop' : 'once'} onChange={(v) => set({ loop: v === 'loop' })} options={[{ value: 'once', label: 'Executar uma vez' }, { value: 'loop', label: 'Loop infinito' }]} />
                {s.loop && <Range label="Pausa no valor final" value={s.holdMs} min={200} max={6000} step={100} unit=" ms" onChange={(v) => set({ holdMs: v })} />}
              </Section>
            )}

            <Section title="Dimensões e qualidade do GIF" defaultOpen={false}>
              <Field label="Tamanho">
                <div className="flex flex-wrap gap-2">
                  {DIMENSION_PRESETS.map((d) => (
                    <button key={d.key} type="button" onClick={() => set({ width: d.width, height: d.height })}
                      className={cn('h-9 rounded-lg border px-3 font-mono text-xs transition-colors duration-150', s.width === d.width && s.height === d.height ? 'border-gold bg-gold-soft text-gold' : 'border-white/10 text-white/75 hover:border-white/25')}>
                      {d.key}
                    </button>
                  ))}
                </div>
              </Field>
              <Grid>
                <Input label="Largura (px)" type="number" min={80} max={800} value={s.width} onChange={(e) => set({ width: Number(e.target.value) })} />
                <Input label="Altura (px)" type="number" min={40} max={800} value={s.height} onChange={(e) => set({ height: Number(e.target.value) })} />
              </Grid>
              {type !== 'alert' && (
                <Segmented label="Qualidade / tamanho do arquivo" value={quality} onChange={(v) => v !== 'custom' && set(type === 'countdown' ? { frames: QUALITY[v].frames, fps: QUALITY[v].fps } : { fps: QUALITY[v].fps })}
                  options={Object.entries(QUALITY).map(([k, q]) => ({ value: k as keyof typeof QUALITY, label: q.label }))} />
              )}
              {type === 'countdown' && <p className="hint">A contagem é gerada no momento em que o GIF é aberto e anima por {s.frames} segundos.</p>}
            </Section>

            {row && (
              <Section title="Status" defaultOpen={false}>
                <Select label="Status do contador" value={status === 'expired' ? 'active' : status} onChange={(e) => { setStatus(e.target.value as Status); setDirty(true) }}
                  options={type === 'countdown'
                    ? [{ value: 'draft', label: 'Rascunho' }, { value: 'active', label: 'Ativo (expira automaticamente)' }, { value: 'archived', label: 'Arquivado' }]
                    : [{ value: 'draft', label: 'Rascunho' }, { value: 'active', label: 'Ativo' }, { value: 'archived', label: 'Arquivado' }]}
                  hint="Rascunhos e arquivados não aparecem na URL pública." />
              </Section>
            )}
          </div>
        </div>
      </PageBody>
      <GifResultModal result={result} alt={s.title || name || 'Contador'} onClose={() => setResult(null)} />
    </>
  )
}
