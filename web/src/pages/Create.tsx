import { Link } from 'react-router-dom'
import { TYPES, TYPE_LABELS, type CounterType } from '@shared/render.js'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { CounterCanvas, PreviewStage } from '@/components/CounterCanvas'
import { TypeIcon } from '@/components/TypeIcon'

export const TYPE_DESCRIPTIONS: Record<CounterType, string> = {
  countdown: 'Crie um contador regressivo para uma data e horário específicos.',
  percentage: 'Crie um indicador visual de porcentagem.',
  progress: 'Crie uma barra de progresso animada.',
  alert: 'Crie um sinal de alerta piscando para chamar atenção.',
}

export default function Create() {
  const target = new Date(Date.now() + (3 * 86400 + 3 * 3600 + 29 * 60) * 1000).toISOString()
  const sample: Record<CounterType, object> = {
    countdown: { targetAt: target, width: 320, height: 130 },
    percentage: { value: 38, width: 320, height: 130 },
    progress: { current: 383, max: 1000, width: 320, height: 130 },
    alert: { width: 320, height: 130, speed: 1 },
  }
  return (
    <>
      <PageHeader title="Criar novo contador" subtitle="Escolha o tipo de contador" />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {TYPES.map((t) => (
            <Link key={t} to={`/criar/${t}`} className="card group flex flex-col p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-gold-dim hover:shadow-gold">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg border border-gold-dim bg-gold-soft text-gold"><TypeIcon type={t} /></span>
                <span>
                  <span className="block font-display font-bold">{TYPE_LABELS[t]}</span>
                  <span className="block text-xs text-muted group-hover:text-gold">Clique para começar</span>
                </span>
              </div>
              <p className="mt-4 text-sm text-white/80">{TYPE_DESCRIPTIONS[t]}</p>
              <PreviewStage className="mt-4 h-40"><CounterCanvas type={t} settings={sample[t]} animate maxHeight={130} /></PreviewStage>
            </Link>
          ))}
        </div>
      </PageBody>
    </>
  )
}
