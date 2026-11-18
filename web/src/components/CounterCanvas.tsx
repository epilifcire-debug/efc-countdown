import { useEffect, useRef, useState } from 'react'
import { drawFrame, familyOf, stateAt, withDefaults, type CounterType, type Settings } from '@shared/render.js'
import { cn } from '@/lib/utils'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Preview fiel do GIF: usa o mesmo renderizador do servidor.
 * animate=false desenha o estado final (listas); a contagem regressiva sempre atualiza a cada segundo.
 */
export function CounterCanvas({ type, settings, animate = true, className, maxHeight }: {
  type: CounterType; settings: Settings; animate?: boolean; className?: string; maxHeight?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [fontsReady, setFontsReady] = useState(0)
  const s = withDefaults(type, settings)
  const key = JSON.stringify(s)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const family = familyOf(s.fontFamily)
    Promise.all([
      document.fonts.load(`${s.fontWeight} 40px "${family}"`),
      document.fonts.load(`500 40px "${family}"`),
      document.fonts.load(`600 40px "${family}"`),
    ]).finally(() => setFontsReady((n) => n + 1))
  }, [s.fontFamily, s.fontWeight])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !visible) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = s.width * dpr
    canvas.height = s.height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let preview = s
    if (type === 'alert' && reducedMotion()) preview = { ...s, speed: Math.min(1, s.speed) }
    const start = performance.now()
    let raf = 0
    let timer = 0

    const paint = () => {
      const elapsed = performance.now() - start
      const state = !animate && type !== 'countdown' ? (type === 'alert' ? { phase: 0 } : { t: 1 }) : stateAt(type, preview, elapsed)
      drawFrame(ctx, type, preview, state, dpr)
    }

    if (type === 'countdown') {
      paint()
      timer = window.setInterval(paint, 1000)
    } else if (!animate) {
      paint()
    } else {
      const loop = () => { paint(); raf = requestAnimationFrame(loop) }
      loop()
    }
    return () => { cancelAnimationFrame(raf); clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, type, animate, visible, fontsReady])

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Prévia: ${s.title || 'contador'}`}
      className={cn('mx-auto block h-auto max-w-full', className)}
      style={{ width: maxHeight ? Math.min(s.width, (maxHeight * s.width) / s.height) : s.width, aspectRatio: `${s.width} / ${s.height}` }}
    />
  )
}

/** Fundo xadrez para enxergar transparência. */
export function PreviewStage({ children, className, checker }: { children: React.ReactNode; className?: string; checker?: boolean }) {
  return (
    <div
      className={cn('flex items-center justify-center overflow-hidden rounded-lg bg-ink p-4', className)}
      style={checker ? { backgroundImage: 'conic-gradient(#1a1a1a 25%, #111 0 50%, #1a1a1a 0 75%, #111 0)', backgroundSize: '16px 16px' } : undefined}
    >
      {children}
    </div>
  )
}
