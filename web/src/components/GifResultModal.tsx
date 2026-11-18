import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { Button, Modal, Segmented } from './ui'
import { copy, fmtSize, htmlSnippet } from '@/lib/utils'
import type { GifResult } from '@/lib/types'

const WIDTHS = ['300px', '400px', '500px', '600px', '100%'] as const

export function HtmlCodeBox({ url, alt, defaultWidth = '400px' }: { url: string; alt: string; defaultWidth?: string }) {
  const [width, setWidth] = useState<string>(WIDTHS.includes(defaultWidth as never) ? defaultWidth : '400px')
  const code = htmlSnippet(url, width, alt)
  return (
    <div className="space-y-4">
      <div>
        <span className="label">URL da imagem</span>
        <div className="flex gap-2">
          <input readOnly value={url} className="field font-mono text-xs" onFocus={(e) => e.target.select()} aria-label="URL da imagem" />
          <Button onClick={() => copy(url, 'URL copiada')} className="shrink-0"><Copy className="h-4 w-4" />Copiar URL</Button>
        </div>
      </div>
      <Segmented label="Largura máxima" value={width} onChange={setWidth} options={WIDTHS.map((w) => ({ value: w, label: w }))} />
      <div>
        <span className="label">Código HTML</span>
        <pre className="whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-ink p-4 font-mono text-xs leading-relaxed text-gold-light"><code>{code}</code></pre>
        <Button variant="primary" className="mt-3 w-full" onClick={() => copy(code, 'Código copiado')}><Copy className="h-4 w-4" />Copiar código</Button>
      </div>
    </div>
  )
}

export function GifResultModal({ result, alt, onClose }: { result: GifResult | null; alt: string; onClose: () => void }) {
  return (
    <Modal open={Boolean(result)} onClose={onClose} title="Seu GIF está pronto!" wide>
      {result && (
        <div className="space-y-5">
          <div className="flex items-center justify-center rounded-lg bg-ink p-4">
            <img src={result.file_url.startsWith('http') ? `${result.file_url}?v=${Date.now()}` : result.file_url} alt={alt} width={result.width} height={result.height} className="h-auto max-w-full" />
          </div>
          <p className="flex items-center gap-2 text-xs text-muted"><Check className="h-4 w-4 text-success" />{result.width}×{result.height} px · {fmtSize(result.file_size)} · {import.meta.env.VITE_DEMO === '1' ? 'gerado no navegador (demonstração)' : 'hospedado pela EFC'}</p>
          <HtmlCodeBox url={result.file_url} alt={alt} />
          {import.meta.env.VITE_DEMO !== '1' && <a href={result.storage_url} download className="block"><Button className="w-full"><Download className="h-4 w-4" />Baixar GIF</Button></a>}
        </div>
      )}
    </Modal>
  )
}
