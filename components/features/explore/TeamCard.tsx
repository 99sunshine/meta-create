'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TeamWithMembers } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { getRoleMetadata } from '@/constants/roles'
import { JoinTeamDialog } from '@/components/features/teams/JoinTeamDialog'
import type { Role } from '@/types/interfaces/Role'

interface TeamCardProps {
  team: TeamWithMembers
  currentUserId?: string
  onJoinTeam?: (teamId: string, role: Role) => void | Promise<void>
  isJoining?: boolean
  matchScore?: number
  matchReasons?: string[]
}

export function TeamCard({ team, currentUserId, onJoinTeam, isJoining = false, matchScore, matchReasons }: TeamCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const displayDescription = team.description 
    ? (team.description.length > 150 
        ? team.description.slice(0, 150) + '...' 
        : team.description)
    : 'No description provided'

  const displayMembers = team.members.slice(0, 5)
  const hasMoreMembers = team.members.length > 5

  const memberRoles = new Set(team.members.map(m => m.role))
  const allRoles = ['Visionary', 'Builder', 'Strategist', 'Connector']
  const missingRoles = allRoles.filter(role => !memberRoles.has(role))

  const lookingForRoles = team.looking_for_roles || missingRoles

  const isAlreadyMember = currentUserId ? team.members.some(member => member.id === currentUserId) : false

  const handleJoinClick = () => {
    if (onJoinTeam) {
      setDialogOpen(true)
    }
  }

  const handleJoinConfirm = async (role: Role) => {
    if (onJoinTeam) {
      await onJoinTeam(team.id, role)
      setDialogOpen(false)
    }
  }

  return (
    <Card className="overflow-hidden border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="p-5 space-y-4">
        {/* Match score badge */}
        {matchScore !== undefined && matchScore > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', border: '1px solid rgba(231,119,15,0.3)' }}>
              🎯 {matchScore}% match
            </span>
            {matchReasons?.map((r) => (
              <span key={r} className="text-xs text-white/40">{r}</span>
            ))}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white line-clamp-1">
                {team.name}
              </h3>
              <span className="text-xs text-slate-400">
                {team.member_count}/{team.max_members} members
              </span>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {team.category}
          </span>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2">
          {displayDescription}
        </p>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {displayMembers.map((member) => (
              <Link
                key={member.id}
                href={`/creator/${member.id}`}
                title={`${member.name} (${member.role})`}
                className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800 hover:opacity-80 transition-opacity"
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </Link>
            ))}
            {hasMoreMembers && (
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-medium border-2 border-slate-800">
                +{team.members.length - 5}
              </div>
            )}
          </div>
        </div>

        {lookingForRoles.length > 0 && (
          <div className="pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Looking for:</p>
            <div className="flex flex-wrap gap-2">
              {lookingForRoles.slice(0, 3).map((role, idx) => {
                const roleMetadata = getRoleMetadata(role as Role)
                const RoleIcon = roleMetadata?.icon
                return (
                  <span 
                    key={idx}
                    className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600 flex items-center gap-1"
                  >
                    {RoleIcon && <RoleIcon className="h-3 w-3" />}
                    {role}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {team.is_open && onJoinTeam && (
          <>
            <Button 
              variant="outline"
              onClick={handleJoinClick}
              disabled={isJoining}
              className="w-full bg-blue-500/10 border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400"
            >
              {isJoining ? 'Joining...' : 'Join Team'}
            </Button>

            <JoinTeamDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              teamName={team.name}
              onJoin={handleJoinConfirm}
              loading={isJoining}
              isAlreadyMember={isAlreadyMember}
            />
          </>
        )}
      </div>
    </Card>
  )
}
