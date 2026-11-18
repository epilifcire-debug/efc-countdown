import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate } from 'lucide-react'
import { TYPES, TYPE_LABELS } from '@shared/render.js'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { Button, EmptyState, ErrorState, Segmented, Skeleton } from '@/components/ui'
import { CounterCanvas, PreviewStage } from '@/components/CounterCanvas'
import { useTemplates } from '@/hooks/useCounters'

export default function Templates() {
  const q = useTemplates()
  const nav = useNavigate()
  const [cat, setCat] = useState('all')
  const target = new Date(Date.now() + (2 * 86400 + 3 * 3600 + 29 * 60) * 1000).toISOString()
  const rows = (q.data ?? []).filter((t) => cat === 'all' || t.type === cat)

  return (
    <>
      <PageHeader title="Modelos" subtitle="Escolha um modelo pronto e personalize as cores, tamanhos e textos." />
      <PageBody>
        <div className="mb-6 max-w-3xl">
          <Segmented value={cat} onChange={setCat} options={[{ value: 'all', label: 'Todos' }, ...TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))]} />
        </div>
        {q.isError ? <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
          : q.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}</div>
            : rows.length === 0 ? <EmptyState icon={<LayoutTemplate className="h-6 w-6" />} title="Nenhum modelo nesta categoria" />
              : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {rows.map((t) => (
                    <article key={t.id} className="card flex flex-col p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display font-bold">{t.name}</h3>
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{TYPE_LABELS[t.type]}</span>
                      </div>
                      <PreviewStage className="mt-4 h-40">
                        <CounterCanvas type={t.type} settings={{ ...t.settings, targetAt: target }} animate={t.type === 'alert'} maxHeight={128} />
                      </PreviewStage>
                      <Button variant="primary" className="mt-4 w-full" onClick={() => nav(`/criar/${t.type}?modelo=${t.id}`)}>Usar este modelo</Button>
                    </article>
                  ))}
                </div>
              )}
      </PageBody>
    </>
  )
}
