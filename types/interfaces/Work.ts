import type { Tables } from '../supabase'

export type Work = Tables<'works'>

export interface WorkCreator {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

export interface WorkWithCreator extends Omit<Work, 'creator'> {
  creator: WorkCreator
}

// View type from database (with Json types)
export interface WorkWithCreatorView {
  id: string | null
  title: string | null
  description: string | null
  category: string | null
  tags: string[] | null
  images: string[] | null
  links: string[] | null
  save_count: number | null
  user_id: string | null
  created_at: string | null
  updated_at: string | null
  collaborator_ids: string[] | null
  event_id: string | null
  creator: unknown // Json type from view
}
