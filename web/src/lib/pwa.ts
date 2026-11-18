// PWA: registro do service worker, aviso de nova versão e convite de instalação.
import { toast } from 'sonner'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const canPromptInstall = () => Boolean(deferred)

export function onInstallChange(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export async function promptInstall() {
  if (!deferred) return false
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  notify()
  return outcome === 'accepted'
}

export function setupPwa() {
  if (import.meta.env.VITE_DEMO === '1' || !('serviceWorker' in navigator) || !import.meta.env.PROD) return

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; notify() })
  window.addEventListener('appinstalled', () => { deferred = null; notify(); toast.success('EFC Countdown instalado!') })

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      const offerUpdate = (worker: ServiceWorker) => {
        toast('Nova versão disponível', {
          duration: Infinity,
          action: { label: 'Atualizar', onClick: () => worker.postMessage('SKIP_WAITING') },
        })
      }
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting)
      reg.addEventListener('updatefound', () => {
        const w = reg.installing
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w) })
      })
      let reloaded = false
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; window.location.reload() } })
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000)
    } catch { /* site continua funcionando sem PWA */ }
  })
}
