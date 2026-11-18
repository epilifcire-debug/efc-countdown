declare module '@shared/render.js' {
  export type CounterType = 'countdown' | 'percentage' | 'progress' | 'alert'
  export type Settings = Record<string, any>
  export const TYPES: CounterType[]
  export const TYPE_LABELS: Record<CounterType, string>
  export const FONTS: { key: string; label: string; family: string }[]
  export const DIMENSION_PRESETS: { key: string; width: number; height: number }[]
  export const PERCENT_STYLES: { key: string; label: string }[]
  export const ALERT_ICONS: { key: string; label: string }[]
  export const BLINK_STYLES: { key: string; label: string }[]
  export const BLINK_TARGETS: { key: string; label: string }[]
  export const MAX_BLINK_HZ: number
  export const DEFAULTS: Record<CounterType, Settings>
  export function withDefaults(type: CounterType, s?: Settings): Settings
  export function familyOf(key: string): string
  export function zonedToUtc(date: string, time: string, tz: string): string | null
  export function stateAt(type: CounterType, s: Settings, elapsedMs: number, nowMs?: number): any
  export function drawFrame(ctx: CanvasRenderingContext2D, type: CounterType, s: Settings, state: any, scale?: number): void
  export function pct(current: number, max: number): number
}
declare module '@shared/templates.js' {
  export const SYSTEM_TEMPLATES: { name: string; type: import('@shared/render.js').CounterType; settings: Record<string, any> }[]
}
interface Window { __ENV?: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string; PUBLIC_URL: string } }
declare module '@shared/gif-core.js' {
  export function encodeGif(createCanvas: (w: number, h: number) => HTMLCanvasElement, gifenc: any, type: import('@shared/render.js').CounterType, settings: Record<string, any>, nowMs?: number): Promise<{ bytes: Uint8Array; width: number; height: number; frames: number }>
}
declare module 'gifenc'
