import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteCountdown, duplicateCountdown, listCountdowns, listTemplates } from '@/lib/api'
import type { Countdown } from '@/lib/types'

export const useCountdowns = () => useQuery({ queryKey: ['countdowns'], queryFn: listCountdowns })
export const useTemplates = () => useQuery({ queryKey: ['templates'], queryFn: listTemplates, staleTime: 5 * 60_000 })

export function useCounterActions() {
  const qc = useQueryClient()
  const refresh = () => { qc.invalidateQueries({ queryKey: ['countdowns'] }); qc.invalidateQueries({ queryKey: ['files'] }) }
  const duplicate = useMutation({
    mutationFn: (c: Countdown) => duplicateCountdown(c),
    onSuccess: () => { toast.success('Contador duplicado.'); refresh() },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: (c: Countdown) => deleteCountdown(c),
    onSuccess: () => { toast.success('Contador excluído.'); refresh() },
    onError: (e: Error) => toast.error(e.message),
  })
  return { duplicate, remove }
}
