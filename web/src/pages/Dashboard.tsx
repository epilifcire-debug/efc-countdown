import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck, Clock, Images, Plus, TimerOff } from 'lucide-react'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui'
import { CounterCard, CounterCardSkeleton } from '@/components/CounterCard'
import { useCountdowns } from '@/hooks/useCounters'
import { countFiles } from '@/lib/api'
import { effectiveStatus } from '@/lib/utils'
import { displayName, useAuth } from '@/hooks/useAuth'

function StatCard({ label, value, icon, loading }: { label: string; value: number; icon: React.ReactNode; loading?: boolean }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between"><span className="eyebrow">{label}</span><span className="text-gold">{icon}</span></div>
      {loading ? <Skeleton className="mt-3 h-8 w-14" /> : <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const q = useCountdowns()
  const files = useQuery({ queryKey: ['files', 'count'], queryFn: countFiles })
  const list = q.data ?? []
  const status = list.map(effectiveStatus)
  const first = displayName(user).split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Olá, ${first} 👋`}
        subtitle="Gerencie seus contadores e crie novos elementos para seus sites."
        actions={<Link to="/criar"><Button variant="primary"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Criar novo contador</span><span className="sm:hidden">Novo</span></Button></Link>}
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Total de contadores" value={list.length} icon={<Clock className="h-5 w-5" />} loading={q.isLoading} />
          <StatCard label="Contadores ativos" value={status.filter((s) => s === 'active').length} icon={<CircleCheck className="h-5 w-5" />} loading={q.isLoading} />
          <StatCard label="Expirados" value={status.filter((s) => s === 'expired').length} icon={<TimerOff className="h-5 w-5" />} loading={q.isLoading} />
          <StatCard label="GIFs gerados" value={files.data ?? 0} icon={<Images className="h-5 w-5" />} loading={files.isLoading} />
        </div>

        <div className="mb-4 mt-10 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Meus contadores recentes</h2>
          {list.length > 0 && <Link to="/contadores" className="text-sm font-medium text-gold hover:text-gold-light">Ver todos</Link>}
        </div>
        {q.isError ? (
          <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
        ) : q.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <CounterCardSkeleton key={i} />)}</div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6" />} title="Você ainda não criou nenhum contador."
            text="Crie uma contagem regressiva, porcentagem, barra de progresso ou alerta em poucos minutos."
            action={<Link to="/criar"><Button variant="primary"><Plus className="h-4 w-4" />Criar primeiro contador</Button></Link>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.slice(0, 6).map((c) => <CounterCard key={c.id} c={c} />)}</div>
        )}
      </PageBody>
    </>
  )
}
