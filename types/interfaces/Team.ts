import type { Tables } from '../supabase'

export type Team = Tables<'teams'>

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

export interface TeamWithMembers extends Omit<Team, 'members' | 'member_count'> {
  members: TeamMember[]
  member_count: number
}

// View type from database (with Json types)
export interface TeamWithMembersView {
  id: string | null
  name: string | null
  description: string | null
  category: string | null
  is_open: boolean | null
  max_members: number | null
  owner_id: string | null
  created_at: string | null
  updated_at: string | null
  event_id: string | null
  event_track: string | null
  external_chat_link: string | null
  looking_for_roles: string[] | null
  members: unknown // Json type from view
  member_count: number | null
}
