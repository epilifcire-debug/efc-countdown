import { useEffect, useState } from 'react'
import { Download, Share, SquarePlus } from 'lucide-react'
import { Button, Modal } from './ui'
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '@/lib/pwa'

/** Botão "Instalar app": usa o convite nativo (Android/Chrome) ou mostra instruções no iPhone. */
export function InstallApp({ variant = 'nav' }: { variant?: 'nav' | 'card' }) {
  const [, force] = useState(0)
  const [help, setHelp] = useState(false)
  useEffect(() => onInstallChange(() => force((n) => n + 1)), [])
  if (isStandalone()) return variant === 'card' ? <p className="text-sm text-muted">O app já está instalado neste aparelho.</p> : null
  const native = canPromptInstall()
  const ios = isIOS()
  if (!native && !ios && variant === 'nav') return null

  const onClick = () => (native ? promptInstall() : setHelp(true))
  return (
    <>
      {variant === 'nav' ? (
        <button onClick={onClick} className="flex h-11 w-full items-center gap-3 rounded-lg border border-gold-dim px-3 text-[15px] text-gold transition-colors duration-150 hover:bg-gold-soft">
          <Download className="h-[18px] w-[18px]" aria-hidden />Instalar app
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">Instale o EFC Countdown no celular para abrir direto da tela inicial, em tela cheia.</p>
          {native || ios
            ? <Button variant="primary" onClick={onClick}><Download className="h-4 w-4" />Instalar app</Button>
            : <p className="text-xs text-muted">No Chrome ou Edge, use o menu do navegador → “Instalar app”. No iPhone, abra no Safari → Compartilhar → “Adicionar à Tela de Início”.</p>}
        </div>
      )}
      <Modal open={help} onClose={() => setHelp(false)} title="Instalar no iPhone">
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-soft text-gold">1</span><span>Abra este site no <b>Safari</b>.</span></li>
          <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-soft text-gold">2</span><span>Toque em <Share className="inline h-4 w-4 align-text-bottom text-gold" /> <b>Compartilhar</b>.</span></li>
          <li className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-soft text-gold">3</span><span>Escolha <SquarePlus className="inline h-4 w-4 align-text-bottom text-gold" /> <b>Adicionar à Tela de Início</b>.</span></li>
        </ol>
      </Modal>
    </>
  )
}
