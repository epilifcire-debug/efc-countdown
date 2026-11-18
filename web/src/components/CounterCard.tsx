import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Code2, Copy, Eye, Pencil, Trash2 } from 'lucide-react'
import { TYPE_LABELS } from '@shared/render.js'
import { CounterCanvas, PreviewStage } from './CounterCanvas'
import { Button, ConfirmDialog, Modal, StatusBadge } from './ui'
import { HtmlCodeBox } from './GifResultModal'
import { effectiveStatus, fmtDate, fmtDateTime, rowSettings } from '@/lib/utils'
import { useCounterActions } from '@/hooks/useCounters'
import type { Countdown } from '@/lib/types'

export function CounterCard({ c }: { c: Countdown }) {
  const nav = useNavigate()
  const { duplicate, remove } = useCounterActions()
  const [confirm, setConfirm] = useState(false)
  const [code, setCode] = useState(false)
  const status = effectiveStatus(c)
  const s = rowSettings(c)

  return (
    <article className="card flex flex-col p-4 transition-colors duration-150 hover:border-gold-dim sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-bold uppercase">{c.name}</h3>
          <p className="text-xs text-muted">{TYPE_LABELS[c.type]}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <Link to={`/contadores/${c.id}`} className="mt-4 block" aria-label={`Editar ${c.name}`}>
        <PreviewStage className="h-36" checker={s.bgMode === 'transparent'}>
          <CounterCanvas type={c.type} settings={s} animate={false} maxHeight={112} />
        </PreviewStage>
      </Link>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="eyebrow text-[10px]">Criado em</dt><dd className="mt-0.5 font-medium">{fmtDate(c.created_at)}</dd></div>
        <div><dt className="eyebrow text-[10px]">{c.type === 'countdown' ? 'Término' : 'Atualizado em'}</dt><dd className="mt-0.5 font-medium">{c.type === 'countdown' ? fmtDateTime(c.target_at, c.timezone || undefined) : fmtDate(c.updated_at)}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => nav(`/contadores/${c.id}`)}><Pencil className="h-4 w-4" />Editar</Button>
        <Button size="sm" onClick={() => duplicate.mutate(c)} loading={duplicate.isPending}><Copy className="h-4 w-4" />Duplicar</Button>
        <Button size="sm" onClick={() => setCode(true)} disabled={!c.gif_url} title={c.gif_url ? undefined : 'Gere o GIF primeiro'}><Code2 className="h-4 w-4" />Código</Button>
        {c.gif_url && <a href={c.gif_url} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><Eye className="h-4 w-4" />Ver GIF</Button></a>}
        <Button size="sm" variant="danger-ghost" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" />Excluir</Button>
      </div>
      <ConfirmDialog
        open={confirm} onClose={() => setConfirm(false)} loading={remove.isPending}
        title="Excluir contador?" text={`“${c.name}” e os GIFs gerados serão excluídos. A URL pública deixará de funcionar.`}
        onConfirm={() => remove.mutate(c, { onSuccess: () => setConfirm(false) })}
      />
      <Modal open={code} onClose={() => setCode(false)} title="Código do contador" wide>
        {c.gif_url && <HtmlCodeBox url={c.gif_url} alt={c.title || c.name} />}
      </Modal>
    </article>
  )
}

export function CounterCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-4 w-2/3" /><div className="skeleton mt-2 h-3 w-1/3" />
      <div className="skeleton mt-4 h-36" /><div className="skeleton mt-4 h-8" />
    </div>
  )
}
