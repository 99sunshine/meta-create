import { createClient } from '../utils/client'
import type { TeamWithMembers, TeamWithMembersView, TeamMember, TeamCreateInput } from '@/types'
import { teamCreateSchema } from '@/schemas/team'
import { ROLES } from '@/constants/roles'
import type { Role } from '@/types/interfaces/Role'

function parseTeamView(view: TeamWithMembersView): TeamWithMembers {
  return {
    id: view.id!,
    name: view.name!,
    description: view.description,
    category: view.category!,
    is_open: view.is_open ?? false,
    max_members: view.max_members ?? 6,
    owner_id: view.owner_id!,
    created_at: view.created_at!,
    updated_at: view.updated_at!,
    event_id: view.event_id,
    event_track: view.event_track,
    external_chat_link: view.external_chat_link,
    looking_for_roles: view.looking_for_roles,
    members: (view.members as TeamMember[]) || [],
    member_count: view.member_count ?? 0
  }
}

export class TeamsRepository {
  /**
   * Get open teams (recruiting) with members
   * Queries the teams_with_members view (no N+1 problem)
   */
  async getOpenTeams(limit: number = 20): Promise<TeamWithMembers[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('teams_with_members')
      .select('*')
      .eq('is_open', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch open teams: ${error.message}`)
    }

    return (data || []).map(parseTeamView)
  }

  /**
   * Get recent teams with members
   */
  async getRecentTeams(limit: number = 20): Promise<TeamWithMembers[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('teams_with_members')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`)
    }

    return (data || []).map(parseTeamView)
  }

  /**
   * Get single team by ID with members
   */
  async getTeamById(teamId: string): Promise<TeamWithMembers | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('teams_with_members')
      .select('*')
      .eq('id', teamId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch team: ${error.message}`)
    }

    return parseTeamView(data)
  }

  /**
   * Get teams by category
   */
  async getTeamsByCategory(category: string, limit: number = 20): Promise<TeamWithMembers[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('teams_with_members')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch teams by category: ${error.message}`)
    }

    return (data || []).map(parseTeamView)
  }

  /**
   * Get teams where user is owner
   */
  /**
   * Teams the user is a member of (including teams they own).
   */
  async getTeamsForUser(userId: string, limit: number = 50): Promise<TeamWithMembers[]> {
    const supabase = createClient()

    const { data: rows, error } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch user team ids: ${error.message}`)
    }

    const ids = [...new Set((rows ?? []).map((r) => r.team_id).filter(Boolean))] as string[]
    if (ids.length === 0) return []

    const { data: teams, error: teamsError } = await supabase
      .from('teams_with_members')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (teamsError) {
      throw new Error(`Failed to fetch teams for user: ${teamsError.message}`)
    }

    return (teams ?? []).map(parseTeamView)
  }

  async getTeamsByOwnerId(ownerId: string, limit: number = 20): Promise<TeamWithMembers[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('teams_with_members')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch user teams: ${error.message}`)
    }

    return (data || []).map(parseTeamView)
  }

  /**
   * Create a new team
   * Creator automatically becomes owner and first member
   */
  async createTeam(teamData: TeamCreateInput, creatorId: string): Promise<TeamWithMembers> {
    const supabase = createClient()
    
    // Validate input with Zod
    const validated = teamCreateSchema.parse(teamData)
    
    // Insert team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: validated.name,
        description: validated.description,
        category: validated.category,
        looking_for_roles: validated.looking_for_roles || null,
        event_id: validated.event_id || null,
        external_chat_link: validated.external_chat_link || null,
        is_open: validated.is_open,
        max_members: validated.max_members,
        owner_id: creatorId
      })
      .select()
      .single()

    if (teamError) {
      throw new Error(`Failed to create team: ${teamError.message}`)
    }

    // Add creator as first member with admin rights
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: creatorId,
        role: 'Builder', // Default role, can be customized
        is_admin: true
      })

    if (memberError) {
      throw new Error(`Failed to add creator to team: ${memberError.message}`)
    }

    // Fetch the complete team with members from view
    const createdTeam = await this.getTeamById(team.id)
    
    if (!createdTeam) {
      throw new Error('Failed to fetch created team')
    }

    return createdTeam
  }

  /**
   * Join an open team
   * User must provide their role (Visionary, Builder, Strategist, Connector)
   * Validates team is open and not full before joining
   */
  async joinTeam(teamId: string, userId: string, role: Role): Promise<void> {
    const supabase = createClient()
    
    // First check if team exists and is open
    const team = await this.getTeamById(teamId)
    
    if (!team) {
      throw new Error('Team not found')
    }
    
    if (!team.is_open) {
      throw new Error('This team is not accepting new members')
    }
    
    if (team.member_count >= team.max_members) {
      throw new Error('This team is full')
    }
    
    // Validate role is one of the 4 valid roles
    const validRoles = ROLES.map(r => r.name)
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    }
    
    // Add user to team (RLS policy ensures user_id matches auth.uid())
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role,
        is_admin: false
      })

    if (error) {
      throw new Error(`Failed to join team: ${error.message}`)
    }
  }
}
