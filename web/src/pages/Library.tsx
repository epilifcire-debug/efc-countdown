import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Code2, Copy, Images, Pencil, Trash2 } from 'lucide-react'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { Button, ConfirmDialog, EmptyState, ErrorState, Modal, Skeleton } from '@/components/ui'
import { HtmlCodeBox } from '@/components/GifResultModal'
import { deleteFile, FILES_PAGE, listFiles } from '@/lib/api'
import { copy, fmtDateTime, fmtSize } from '@/lib/utils'
import type { GeneratedFile } from '@/lib/types'

export default function Library() {
  const [page, setPage] = useState(0)
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['files', page], queryFn: () => listFiles(page) })
  const [del, setDel] = useState<GeneratedFile | null>(null)
  const [code, setCode] = useState<GeneratedFile | null>(null)
  const remove = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => { toast.success('Arquivo excluído.'); setDel(null); qc.invalidateQueries({ queryKey: ['files'] }) },
    onError: (e: Error) => toast.error(e.message),
  })
  const pages = Math.max(1, Math.ceil((q.data?.total ?? 0) / FILES_PAGE))

  return (
    <>
      <PageHeader title="Biblioteca de GIFs" subtitle="Todos os arquivos gerados pela sua conta." />
      <PageBody>
        {q.isError ? <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
          : q.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-60" />)}</div>
            : !q.data?.rows.length ? (
              <EmptyState icon={<Images className="h-6 w-6" />} title="Nenhum GIF gerado ainda" text="Os GIFs que você gerar aparecem aqui." action={<Link to="/criar"><Button variant="primary">Criar contador</Button></Link>} />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {q.data.rows.map((f) => (
                    <article key={f.id} className="card flex flex-col p-4 sm:p-5">
                      <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-ink p-3">
                        <img src={f.file_url} alt="GIF gerado" loading="lazy" decoding="async" width={f.width ?? undefined} height={f.height ?? undefined} className="h-auto max-h-full max-w-full" />
                      </div>
                      <p className="mt-3 text-xs text-muted">{fmtDateTime(f.created_at)} · {fmtSize(f.file_size)} · {f.width}×{f.height}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => copy(f.file_url, 'URL copiada')}><Copy className="h-4 w-4" />Copiar URL</Button>
                        <Button size="sm" onClick={() => setCode(f)}><Code2 className="h-4 w-4" />HTML</Button>
                        {f.countdown_id && <Link to={`/contadores/${f.countdown_id}`}><Button size="sm" variant="ghost"><Pencil className="h-4 w-4" />Abrir editor</Button></Link>}
                        <Button size="sm" variant="danger-ghost" onClick={() => setDel(f)}><Trash2 className="h-4 w-4" />Excluir</Button>
                      </div>
                    </article>
                  ))}
                </div>
                {pages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                    <span className="text-sm text-muted">Página {page + 1} de {pages}</span>
                    <Button size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
                  </div>
                )}
              </>
            )}
        <ConfirmDialog open={Boolean(del)} onClose={() => setDel(null)} loading={remove.isPending} title="Excluir arquivo?"
          text="Este arquivo será removido da biblioteca. Esta versão específica do GIF deixará de existir." onConfirm={() => del && remove.mutate(del)} />
        <Modal open={Boolean(code)} onClose={() => setCode(null)} title="Código HTML deste arquivo" wide>
          {code && <HtmlCodeBox url={code.file_url} alt="GIF animado" />}
        </Modal>
      </PageBody>
    </>
  )
}
