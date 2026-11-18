import { lazy, Suspense, useEffect, useState } from 'react'

const ColorBends = lazy(() => import('@components/ColorBends'))

/** Fundo ColorBends com preset dourado EFCSYS. Desliga em movimento reduzido e reduz no mobile. */
export function GoldBackdrop({ fadeTop = 0.88 }: { fadeTop?: number }) {
  const [enabled, setEnabled] = useState(false)
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setMobile(window.innerWidth < 768)
    setEnabled(!reduce)
  }, [])
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{ maskImage: `linear-gradient(to bottom, transparent 0%, black ${Math.round((1 - fadeTop) * 100)}%, black 70%, transparent 100%)`, WebkitMaskImage: `linear-gradient(to bottom, transparent 0%, black ${Math.round((1 - fadeTop) * 100)}%, black 70%, transparent 100%)` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_60%)]" />
      {enabled && (
        <Suspense fallback={null}>
          <div className="absolute inset-0 opacity-60">
            <ColorBends
              colors={['#D4AF37']}
              speed={0.18}
              frequency={1.25}
              noise={0.08}
              bandWidth={0.32}
              rotation={55}
              iterations={mobile ? 1 : 2}
              intensity={mobile ? 0.9 : 1.2}
              mouseInfluence={0}
              parallax={0}
              transparent
            />
          </div>
        </Suspense>
      )}
    </div>
  )
}
