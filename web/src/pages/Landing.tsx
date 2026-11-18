import { Link } from 'react-router-dom'
import { Clock, Percent, BarChart3, Siren, Code2, Zap, Server } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui'
import { CounterCanvas } from '@/components/CounterCanvas'
import { GoldBackdrop } from '@/components/Backdrop'

const FEATURES = [
  { icon: Clock, title: 'Contagem regressiva em GIF', text: 'Data, hora e fuso configuráveis. O GIF mostra sempre o tempo restante real.' },
  { icon: Percent, title: 'Porcentagem animada', text: 'Círculos, barras e números que animam até o valor configurado.' },
  { icon: BarChart3, title: 'Barra de progresso', text: 'Mostre “730 / 1000” e o percentual calculado automaticamente.' },
  { icon: Siren, title: 'Alerta piscando', text: 'Sinal de alerta com cores editáveis e limite seguro de piscadas.' },
  { icon: Code2, title: 'Código HTML pronto', text: 'Copie a URL ou o HTML e cole no seu site, WordPress, Shopify ou e-mail.' },
  { icon: Zap, title: 'GIFs nítidos e leves', text: 'Renderização em alta resolução, fonte vetorial e arquivos otimizados.' },
]

export default function Landing() {
  const target = new Date(Date.now() + (2 * 86400 + 14 * 3600 + 37 * 60) * 1000).toISOString()
  return (
    <div className="min-h-screen bg-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link to="/auth?mode=signup"><Button variant="primary" size="sm">Criar conta</Button></Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <GoldBackdrop />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-dim bg-gold-soft px-3 py-1 text-xs font-semibold text-gold">
              <Server className="h-3.5 w-3.5" aria-hidden /> GIFs gerados e hospedados pela EFC
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
              Contagem regressiva e porcentagem em <span className="text-gold">GIF</span> para seu site
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted">
              Crie contadores, barras de progresso e alertas animados com pré-visualização em tempo real. Copie o código e use em qualquer lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth?mode=signup"><Button variant="primary" size="lg">Começar agora</Button></Link>
              <Link to="/auth"><Button size="lg">Já tenho conta</Button></Link>
            </div>
          </div>
          <div className="card-gold p-4 sm:p-6">
            <CounterCanvas type="countdown" settings={{ targetAt: target, width: 600, height: 180 }} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <CounterCanvas type="percentage" settings={{ value: 73, width: 280, height: 90, title: 'VENDIDOS' }} />
              <CounterCanvas type="alert" settings={{ width: 280, height: 90, title: 'ÚLTIMOS!', subtitle: 'Lote 2', speed: 1 }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Principais recursos</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5 transition-colors duration-150 hover:border-gold-dim">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-gold-dim bg-gold-soft text-gold"><Icon className="h-5 w-5" aria-hidden /></div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-6 text-center text-xs text-muted">
        EFC COUNTDOWN · desenvolvido por EFC Tecnologia · <span className="text-white/60">by: efcsys</span>
      </footer>
    </div>
  )
}
