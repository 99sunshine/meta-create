'use client'

import { useState, useEffect } from 'react'
import type { TeamWithMembers } from '@/types'
import type { Role } from '@/types/interfaces/Role'
import { TeamsRepository } from '@/supabase/repos/teams'

interface UseTeamsOptions {
  limit?: number
  category?: string
  ownerId?: string
  openOnly?: boolean
}

export function useTeams(options: UseTeamsOptions = {}) {
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null)

  const fetchTeams = async () => {
    setLoading(true)
    setError(null)

    try {
      const repo = new TeamsRepository()
      let data: TeamWithMembers[]

      if (options.ownerId) {
        data = await repo.getTeamsByOwnerId(options.ownerId, options.limit)
      } else if (options.category) {
        data = await repo.getTeamsByCategory(options.category, options.limit)
      } else if (options.openOnly) {
        data = await repo.getOpenTeams(options.limit)
      } else {
        data = await repo.getRecentTeams(options.limit)
      }

      setTeams(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch teams'
      setError(errorMessage)
      console.error('useTeams error:', err)
    } finally {
      setLoading(false)
    }
  }

  const joinTeam = async (teamId: string, userId: string, role: Role) => {
    setJoiningTeamId(teamId)
    setError(null)

    try {
      const repo = new TeamsRepository()
      await repo.joinTeam(teamId, userId, role)
      
      await fetchTeams()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join team'
      setError(errorMessage)
      throw err
    } finally {
      setJoiningTeamId(null)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [options.limit, options.category, options.ownerId, options.openOnly])

  return {
    teams,
    loading,
    error,
    joiningTeamId,
    joinTeam,
    refetch: fetchTeams,
  }
}
