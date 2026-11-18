import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { PageBody, PageHeader } from '@/components/AppLayout'
import { Button, Input, Skeleton } from '@/components/ui'
import { getProfile, isAdmin, updateProfile, uploadAvatar } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { InstallApp } from '@/components/InstallApp'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()
  const qc = useQueryClient()
  const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const admin = useQuery({ queryKey: ['is-admin'], queryFn: isAdmin })
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile.data) { setName(profile.data.full_name || ''); setAvatar(profile.data.avatar_url || '') }
  }, [profile.data])

  const saveProfile = async () => {
    if (name.trim().length < 2) return toast.error('Informe seu nome completo.')
    setSaving(true)
    try { await updateProfile({ full_name: name.trim(), avatar_url: avatar || null }); toast.success('Perfil salvo.'); qc.invalidateQueries({ queryKey: ['profile'] }) }
    catch (e) { toast.error((e as Error).message) } finally { setSaving(false) }
  }

  const pickAvatar = async (file?: File) => {
    if (!file) return
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return toast.error('Use uma imagem PNG, JPG ou WEBP.')
    if (file.size > 2 * 1024 * 1024) return toast.error('A foto deve ter no máximo 2 MB.')
    setUploading(true)
    try { setAvatar(await uploadAvatar(file)); toast.success('Foto enviada. Clique em Salvar perfil.') }
    catch (e) { toast.error((e as Error).message) } finally { setUploading(false) }
  }

  const changePassword = async () => {
    if (pwd.length < 6) return setPwdErr('Mínimo de 6 caracteres.')
    if (pwd !== pwd2) return setPwdErr('As senhas não conferem.')
    setPwdErr(''); setPwdSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwd })
    setPwdSaving(false)
    if (error) return toast.error('Não foi possível alterar a senha. Faça login novamente e tente de novo.')
    setPwd(''); setPwd2(''); toast.success('Senha alterada.')
  }

  return (
    <>
      <PageHeader title="Configurações" subtitle="Gerencie seu perfil e sua conta." />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5 sm:p-6">
            <h2 className="eyebrow text-white">Perfil</h2>
            {profile.isLoading ? <Skeleton className="mt-4 h-40" /> : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-gold-dim bg-ink-800 text-xl font-bold text-gold">
                    {avatar ? <img src={avatar} alt="Foto do perfil" className="h-full w-full object-cover" /> : (name || user?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickAvatar(e.target.files?.[0])} />
                  <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploading}><Camera className="h-4 w-4" />Alterar foto</Button>
                </div>
                <Input label="E-mail" value={user?.email || ''} readOnly disabled hint="O e-mail de acesso não pode ser alterado aqui." />
                <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <Button variant="primary" onClick={saveProfile} loading={saving}>Salvar perfil</Button>
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="eyebrow text-white">Segurança</h2>
            <div className="mt-4 space-y-4">
              <Input label="Nova senha" type="password" placeholder="Mínimo 6 caracteres" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
              <Input label="Confirmar nova senha" type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" error={pwdErr} />
              <Button onClick={changePassword} loading={pwdSaving}>Alterar senha</Button>
            </div>
            <div className="mt-6 border-t border-white/[0.06] pt-6">
              <Button variant="danger" onClick={async () => { await signOut(); nav('/auth') }}>Sair da conta</Button>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="eyebrow text-white">Preferências</h2>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-ink-800 px-3 py-3">
              <span><span className="block text-sm font-medium">Tema</span><span className="hint block">O EFC Countdown usa o tema escuro.</span></span>
              <span className="rounded-full border border-gold-dim px-3 py-1 text-xs font-semibold text-gold">Escuro</span>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="eyebrow text-white">App no celular</h2>
            <div className="mt-4"><InstallApp variant="card" /></div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="eyebrow text-white">Conta</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-muted">Perfil de acesso</dt><dd className="font-medium">{admin.data ? 'Administrador' : 'Usuário'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Conta criada em</dt><dd className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}</dd></div>
            </dl>
          </section>
        </div>
      </PageBody>
    </>
  )
}
