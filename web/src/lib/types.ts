import type { CounterType, Settings } from '@shared/render.js'

export type Status = 'draft' | 'active' | 'expired' | 'archived'

export interface Countdown {
  id: string
  user_id: string
  name: string
  type: CounterType
  title: string | null
  subtitle: string | null
  target_date: string | null
  target_time: string | null
  timezone: string | null
  target_at: string | null
  percentage: number | null
  current_value: number | null
  max_value: number | null
  status: Status
  template_id: string | null
  settings: Settings
  gif_url: string | null
  public_id: string
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  name: string
  type: CounterType
  preview_url: string | null
  settings: Settings
  is_public: boolean
  sort_order: number
}

export interface GeneratedFile {
  id: string
  user_id: string
  countdown_id: string | null
  file_type: string
  file_url: string
  file_path: string
  file_size: number | null
  width: number | null
  height: number | null
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

export interface GifResult {
  file_url: string
  storage_url: string
  file_path: string
  width: number
  height: number
  file_size: number
}
