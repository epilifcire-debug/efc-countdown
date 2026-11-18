import { supabase } from './supabase'
import type { Countdown, GeneratedFile, GifResult, Profile, Template } from './types'

function fail(error: { message: string } | null, msg: string): never {
  throw new Error(error?.message ? `${msg} (${error.message})` : msg)
}

export async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Sessão expirada. Faça login novamente.')
  return id
}

export async function listCountdowns(): Promise<Countdown[]> {
  const uid = await currentUserId()
  const { data, error } = await supabase.from('countdowns').select('*').eq('user_id', uid).order('created_at', { ascending: false })
  if (error) fail(error, 'Não foi possível carregar os contadores')
  return data as Countdown[]
}

export async function getCountdown(id: string): Promise<Countdown> {
  const { data, error } = await supabase.from('countdowns').select('*').eq('id', id).maybeSingle()
  if (error) fail(error, 'Não foi possível carregar o contador')
  if (!data) throw new Error('Contador não encontrado.')
  return data as Countdown
}

export type CountdownInput = Partial<Omit<Countdown, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'public_id'>>

export async function saveCountdown(id: string | null, input: CountdownInput): Promise<Countdown> {
  const q = id
    ? supabase.from('countdowns').update(input).eq('id', id).select('*').single()
    : supabase.from('countdowns').insert(input).select('*').single()
  const { data, error } = await q
  if (error) fail(error, 'Não foi possível salvar o contador')
  return data as Countdown
}

export async function duplicateCountdown(c: Countdown): Promise<Countdown> {
  const { id: _id, user_id: _u, created_at: _c, updated_at: _up, public_id: _p, gif_url: _g, ...rest } = c
  return saveCountdown(null, { ...rest, name: `Cópia de ${c.name}`, status: 'draft', gif_url: null })
}

export async function deleteCountdown(c: Countdown) {
  const { data: files } = await supabase.from('generated_files').select('file_path').eq('countdown_id', c.id)
  if (files?.length) await supabase.storage.from('countdown-gifs').remove(files.map((f) => f.file_path))
  const { error } = await supabase.from('countdowns').delete().eq('id', c.id)
  if (error) fail(error, 'Não foi possível excluir o contador')
}

export async function generateGif(countdownId: string): Promise<GifResult> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Sessão expirada. Faça login novamente.')
  const res = await fetch(`/api/gif/${countdownId}/generate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'Não foi possível gerar o GIF.')
  return body as GifResult
}

export async function listTemplates(): Promise<Template[]> {
  const { data, error } = await supabase.from('templates').select('*').order('sort_order')
  if (error) fail(error, 'Não foi possível carregar os modelos')
  return data as Template[]
}

export async function getTemplate(id: string): Promise<Template | null> {
  const { data } = await supabase.from('templates').select('*').eq('id', id).maybeSingle()
  return (data as Template) ?? null
}

export const FILES_PAGE = 24

export async function listFiles(page: number): Promise<{ rows: GeneratedFile[]; total: number }> {
  const uid = await currentUserId()
  const from = page * FILES_PAGE
  const { data, error, count } = await supabase
    .from('generated_files').select('*', { count: 'exact' }).eq('user_id', uid)
    .order('created_at', { ascending: false }).range(from, from + FILES_PAGE - 1)
  if (error) fail(error, 'Não foi possível carregar a biblioteca')
  return { rows: data as GeneratedFile[], total: count ?? 0 }
}

export async function countFiles(): Promise<number> {
  const uid = await currentUserId()
  const { count, error } = await supabase.from('generated_files').select('id', { count: 'exact', head: true }).eq('user_id', uid)
  if (error) fail(error, 'Não foi possível contar os GIFs')
  return count ?? 0
}

export async function deleteFile(f: GeneratedFile) {
  await supabase.storage.from('countdown-gifs').remove([f.file_path])
  const { error } = await supabase.from('generated_files').delete().eq('id', f.id)
  if (error) fail(error, 'Não foi possível excluir o arquivo')
}

export async function getProfile(): Promise<Profile | null> {
  const uid = await currentUserId()
  const { data } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle()
  return (data as Profile) ?? null
}

export async function updateProfile(patch: Partial<Profile>) {
  const uid = await currentUserId()
  const { error } = await supabase.from('profiles').update(patch).eq('user_id', uid)
  if (error) fail(error, 'Não foi possível salvar o perfil')
  await supabase.auth.updateUser({ data: { full_name: patch.full_name, avatar_url: patch.avatar_url } })
}

export async function uploadAvatar(file: File): Promise<string> {
  const uid = await currentUserId()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${uid}/avatar-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('countdown-gifs').upload(path, file, { contentType: file.type, upsert: true })
  if (error) fail(error, 'Não foi possível enviar a foto')
  return supabase.storage.from('countdown-gifs').getPublicUrl(path).data.publicUrl
}

export async function isAdmin(): Promise<boolean> {
  const uid = await currentUserId()
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', uid).eq('role', 'admin').maybeSingle()
  return Boolean(data)
}
