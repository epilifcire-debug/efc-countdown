// Modo demonstração: dados de exemplo em memória (com cópia opcional no navegador).
import { SYSTEM_TEMPLATES } from '@shared/templates.js'
import type { Countdown, GeneratedFile, Profile, Template } from '@/lib/types'

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001'
const KEY = 'efc-countdown-demo-v1'
const now = Date.now()
const iso = (ms: number) => new Date(ms).toISOString()
const day = 86400000

function counter(p: Partial<Countdown> & Pick<Countdown, 'name' | 'type'>, i: number): Countdown {
  return {
    id: `demo-${i}`, user_id: DEMO_USER_ID, title: null, subtitle: null, target_date: null, target_time: null, timezone: null,
    target_at: null, percentage: null, current_value: null, max_value: null, status: 'active', template_id: null, settings: {},
    gif_url: null, public_id: `demo${i}abc`, created_at: iso(now - (10 - i) * day), updated_at: iso(now - (10 - i) * day / 2), ...p,
  }
}

const lilac = { bgColor: '#EDEDED', borderWidth: 0, accentColor: '#3B1F5C', trackColor: '#CFCFCF', numberColor: '#3B1F5C', titleColor: '#3B1F5C', labelColor: '#3B1F5C', subtitleColor: '#3B1F5C', fontFamily: 'jetbrains' }
const target = new Date(now + 3 * day + 5 * 3600000)
const tDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(target)

function seed() {
  const countdowns: Countdown[] = [
    counter({ name: 'Pré-Caju 2026', type: 'countdown', title: '!! ABERTURA DE VENDAS !!', subtitle: 'Segunda às 10:00', target_date: tDate, target_time: '10:00', timezone: 'America/Sao_Paulo', target_at: iso(target.getTime()), settings: {} }, 1),
    counter({ name: 'Precaju Virada', type: 'countdown', title: '!! VIRADA DE LOTE !!', target_date: '2026-10-07', target_time: '00:00', timezone: 'America/Sao_Paulo', target_at: '2026-10-07T03:00:00.000Z', settings: { ...lilac, subtitle: '' } }, 2),
    counter({ name: 'Michele Fest', type: 'percentage', title: 'INGRESSOS VENDIDOS DESSE LOTE', percentage: 75, settings: { ...lilac, style: 'bar_h' } }, 3),
    counter({ name: 'Vendas Lote 1', type: 'percentage', title: 'INGRESSOS VENDIDOS', percentage: 73, settings: { style: 'circle' } }, 4),
    counter({ name: 'Bloco da Alegria', type: 'progress', title: 'INGRESSOS VENDIDOS', current_value: 730, max_value: 1000, settings: {} }, 5),
    counter({ name: 'Últimos ingressos', type: 'alert', title: '!! ÚLTIMOS INGRESSOS !!', subtitle: 'Lote 2 acabando', status: 'draft', settings: { icon: 'siren', blinkStyle: 'alternate', blinkTargets: ['icon', 'title', 'border'], colorA: '#E11D48', colorB: '#D4AF37', borderWidth: 3, titleColor: '#FFFFFF', subtitleColor: '#FFFFFF', speed: 2 } }, 6),
  ]
  const templates: Template[] = SYSTEM_TEMPLATES.map((t, i) => ({ id: `tpl-${i}`, name: t.name, type: t.type, settings: t.settings, preview_url: null, is_public: true, sort_order: i }))
  return { countdowns, templates, files: [] as GeneratedFile[], profile: { id: 'p1', user_id: DEMO_USER_ID, full_name: 'Eric Filipe', email: 'demo@efcsys.com', avatar_url: null } as Profile }
}

type Db = ReturnType<typeof seed>
let db: Db = load()

function load(): Db {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* armazenamento indisponível: segue em memória */ }
  return seed()
}

export function persist() {
  try { window.localStorage.setItem(KEY, JSON.stringify({ ...db, files: db.files.filter((f) => !f.file_url.startsWith('blob:')) })) } catch { /* ignora */ }
}

export function resetDemo() {
  db = seed()
  try { window.localStorage.removeItem(KEY) } catch { /* ignora */ }
}

export const getDb = () => db
