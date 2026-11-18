import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return setError('Mínimo de 6 caracteres.')
    if (password !== confirm) return setError('As senhas não conferem.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) return toast.error('Link expirado ou inválido. Solicite um novo.')
    toast.success('Senha alterada!')
    nav('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-gold w-full max-w-sm space-y-4 p-6" noValidate>
        <h1 className="font-display text-xl font-bold">Nova senha</h1>
        <Input label="Nova senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <Input label="Confirmar senha" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" error={error} />
        <Button type="submit" variant="primary" className="w-full" loading={loading}>Salvar nova senha</Button>
      </form>
    </div>
  )
}
