import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ListOrdered } from 'lucide-react'
import { TYPES, TYPE_LABELS } from '@shared/render.js'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { Button, EmptyState, ErrorState, Select } from '@/components/ui'
import { CounterCard, CounterCardSkeleton } from '@/components/CounterCard'
import { useCountdowns } from '@/hooks/useCounters'
import { effectiveStatus } from '@/lib/utils'

const PAGE = 12

export default function Counters() {
  const q = useCountdowns()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('recent')
  const [limit, setLimit] = useState(PAGE)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    let r = (q.data ?? []).filter((c) =>
      (type === 'all' || c.type === type) &&
      (status === 'all' || effectiveStatus(c) === status) &&
      (!term || c.name.toLowerCase().includes(term) || (c.title || '').toLowerCase().includes(term)))
    r = [...r].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name, 'pt-BR')
        : sort === 'old' ? a.created_at.localeCompare(b.created_at)
          : sort === 'updated' ? b.updated_at.localeCompare(a.updated_at)
            : b.created_at.localeCompare(a.created_at))
    return r
  }, [q.data, search, type, status, sort])

  const filtered = search || type !== 'all' || status !== 'all'

  return (
    <>
      <PageHeader title="Meus Contadores" subtitle="Busque, filtre e gerencie todos os seus contadores."
        actions={<Link to="/criar"><Button variant="primary"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Novo contador</span><span className="sm:hidden">Novo</span></Button></Link>} />
      <PageBody>
        <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <span className="sr-only">Buscar contadores</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE) }} placeholder="Buscar contadores..." className="field pl-9" />
          </label>
          <Select aria-label="Tipo" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: 'all', label: 'Todos os tipos' }, ...TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))]} />
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Ativos' }, { value: 'expired', label: 'Expirados' }, { value: 'draft', label: 'Rascunhos' }, { value: 'archived', label: 'Arquivados' }]} />
          <Select aria-label="Ordenação" value={sort} onChange={(e) => setSort(e.target.value)} options={[{ value: 'recent', label: 'Mais recentes' }, { value: 'old', label: 'Mais antigos' }, { value: 'updated', label: 'Atualizados recentemente' }, { value: 'name', label: 'Nome (A–Z)' }]} />
        </div>
        {filtered && !q.isLoading && <p className="mb-4 text-sm text-muted">{rows.length} {rows.length === 1 ? 'resultado' : 'resultados'} com os filtros aplicados</p>}
        {q.isError ? <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
          : q.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <CounterCardSkeleton key={i} />)}</div>
            : rows.length === 0 ? (
              filtered
                ? <EmptyState icon={<Search className="h-6 w-6" />} title="Nenhum contador encontrado" text="Ajuste a busca ou os filtros." />
                : <EmptyState icon={<ListOrdered className="h-6 w-6" />} title="Você ainda não criou nenhum contador." action={<Link to="/criar"><Button variant="primary"><Plus className="h-4 w-4" />Criar primeiro contador</Button></Link>} />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.slice(0, limit).map((c) => <CounterCard key={c.id} c={c} />)}</div>
                {rows.length > limit && <div className="mt-6 text-center"><Button onClick={() => setLimit((l) => l + PAGE)}>Carregar mais</Button></div>}
              </>
            )}
      </PageBody>
    </>
  )
}
