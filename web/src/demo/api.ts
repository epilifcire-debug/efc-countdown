// Implementação de demonstração de '@/lib/api' — mesma interface, sem backend.
import gifenc from 'gifenc'
import { encodeGif } from '@shared/gif-core.js'
import { familyOf, withDefaults } from '@shared/render.js'
import { DEMO_USER_ID, getDb, persist } from './store'
import { rowSettings } from '@/lib/utils'
import type { Countdown, GeneratedFile, GifResult, Profile, Template } from '@/lib/types'

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2))

export async function currentUserId() { return DEMO_USER_ID }

export async function listCountdowns(): Promise<Countdown[]> {
  await wait()
  return [...getDb().countdowns].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function getCountdown(id: string): Promise<Countdown> {
  await wait(120)
  const c = getDb().countdowns.find((x) => x.id === id)
  if (!c) throw new Error('Contador não encontrado.')
  return structuredClone(c)
}

export type CountdownInput = Partial<Omit<Countdown, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'public_id'>>

export async function saveCountdown(id: string | null, input: CountdownInput): Promise<Countdown> {
  await wait()
  const db = getDb()
  const stamp = new Date().toISOString()
  if (id) {
    const i = db.countdowns.findIndex((x) => x.id === id)
    if (i < 0) throw new Error('Contador não encontrado.')
    db.countdowns[i] = { ...db.countdowns[i], ...input, updated_at: stamp } as Countdown
    persist()
    return structuredClone(db.countdowns[i])
  }
  const c = {
    id: uid(), user_id: DEMO_USER_ID, public_id: uid().replace(/-/g, '').slice(0, 10), created_at: stamp, updated_at: stamp,
    title: null, subtitle: null, target_date: null, target_time: null, timezone: null, target_at: null, percentage: null,
    current_value: null, max_value: null, status: 'draft', template_id: null, settings: {}, gif_url: null, name: 'Contador', type: 'countdown',
    ...input,
  } as Countdown
  db.countdowns.push(c)
  persist()
  return structuredClone(c)
}

export async function duplicateCountdown(c: Countdown): Promise<Countdown> {
  const { id: _i, user_id: _u, created_at: _c, updated_at: _up, public_id: _p, gif_url: _g, ...rest } = c
  return saveCountdown(null, { ...rest, name: `Cópia de ${c.name}`, status: 'draft', gif_url: null })
}

export async function deleteCountdown(c: Countdown) {
  await wait()
  const db = getDb()
  db.countdowns = db.countdowns.filter((x) => x.id !== c.id)
  db.files = db.files.filter((f) => f.countdown_id !== c.id)
  persist()
}

/** Gera o GIF de verdade no navegador, com o mesmo núcleo do servidor. */
export async function generateGif(countdownId: string): Promise<GifResult> {
  const db = getDb()
  const c = db.countdowns.find((x) => x.id === countdownId)
  if (!c) throw new Error('Contador não encontrado.')
  const s = withDefaults(c.type, rowSettings(c))
  const fam = familyOf(s.fontFamily)
  await Promise.all([`${s.fontWeight} 40px "${fam}"`, `500 40px "${fam}"`, `600 40px "${fam}"`].map((f) => document.fonts.load(f)))
  await wait(60)
  const create = (w: number, h: number) => { const el = document.createElement('canvas'); el.width = w; el.height = h; return el }
  const r = await encodeGif(create, gifenc, c.type, s)
  const url = URL.createObjectURL(new Blob([r.bytes as BlobPart], { type: 'image/gif' }))
  const file: GeneratedFile = {
    id: uid(), user_id: DEMO_USER_ID, countdown_id: c.id, file_type: 'gif', file_url: url, file_path: `demo/${c.id}.gif`,
    file_size: r.bytes.length, width: r.width, height: r.height, created_at: new Date().toISOString(),
  }
  db.files.unshift(file)
  c.gif_url = url
  if (c.status === 'draft' || c.status === 'archived') c.status = 'active'
  c.updated_at = new Date().toISOString()
  persist()
  return { file_url: url, storage_url: url, file_path: file.file_path, width: r.width, height: r.height, file_size: r.bytes.length }
}

export async function listTemplates(): Promise<Template[]> { await wait(120); return getDb().templates }
export async function getTemplate(id: string): Promise<Template | null> { return getDb().templates.find((t) => t.id === id) ?? null }

export const FILES_PAGE = 24
export async function listFiles(page: number) {
  await wait()
  const all = getDb().files
  return { rows: all.slice(page * FILES_PAGE, (page + 1) * FILES_PAGE), total: all.length }
}
export async function countFiles() { return getDb().files.length }
export async function deleteFile(f: GeneratedFile) { const db = getDb(); db.files = db.files.filter((x) => x.id !== f.id); persist() }

export async function getProfile(): Promise<Profile | null> { await wait(120); return getDb().profile }
export async function updateProfile(patch: Partial<Profile>) { const db = getDb(); db.profile = { ...db.profile, ...patch }; persist() }
export async function uploadAvatar(file: File): Promise<string> { return URL.createObjectURL(file) }
export async function isAdmin() { return true }
