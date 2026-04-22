'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/supabase/utils/server'
import type { TeamCreateInput, WorkCreateInput } from '@/types'
import { teamCreateSchema } from '@/schemas/team'
import { workCreateSchema } from '@/schemas/work'
import { ContentSafetyError, assertSafeTextWithAi } from '@/lib/content-safety'

export async function createTeamAction(teamData: TeamCreateInput, userId: string) {
  try {
    const supabase = await createClient()
    
    // Validate input
    const validated = teamCreateSchema.parse(teamData)

    await assertSafeTextWithAi(validated.name, '队伍名称')
    await assertSafeTextWithAi(validated.description, '队伍描述')
    
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
        owner_id: userId
      })
      .select()
      .single()

    if (teamError) {
      return { success: false, error: `Failed to create team: ${teamError.message}` }
    }

    // Add creator as first member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'Builder',
        is_admin: true
      })

    if (memberError) {
      return { success: false, error: `Failed to add creator to team: ${memberError.message}` }
    }

    revalidateTag('teams', 'default')
    return { success: true, data: team }
  } catch (error) {
    if (error instanceof ContentSafetyError) {
      return { success: false, error: error.message }
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create team' 
    }
  }
}

export async function createWorkAction(workData: WorkCreateInput, userId: string) {
  try {
    const supabase = await createClient()
    
    // Validate input
    const validated = workCreateSchema.parse(workData)

    await assertSafeTextWithAi(validated.title, '作品标题')
    await assertSafeTextWithAi(validated.description, '作品描述')

    if (validated.team_id) {
      const { data: membership, error: memErr } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', validated.team_id)
        .eq('user_id', userId)
        .maybeSingle()

      if (memErr || !membership) {
        return {
          success: false,
          error: 'You must be a member of the selected team to attach this work.',
        }
      }
    }
    
    // Insert work
    const { data: work, error: workError } = await supabase
      .from('works')
      .insert({
        title: validated.title,
        description: validated.description,
        category: validated.category,
        tags: validated.tags || null,
        images: validated.images || null,
        links: validated.links || null,
        collaborator_ids: validated.collaborator_ids || null,
        team_id: validated.team_id ?? null,
        user_id: userId,
        save_count: 0
      })
      .select()
      .single()

    if (workError) {
      return { success: false, error: `Failed to create work: ${workError.message}` }
    }

    revalidateTag('works', 'default')
    return { success: true, data: work }
  } catch (error) {
    if (error instanceof ContentSafetyError) {
      return { success: false, error: error.message }
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create work' 
    }
  }
}
