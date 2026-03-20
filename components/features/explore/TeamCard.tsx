'use client'

import { TeamWithMembers } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { getRoleMetadata } from '@/constants/roles'

interface TeamCardProps {
  team: TeamWithMembers
}

export function TeamCard({ team }: TeamCardProps) {
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

  return (
    <Card className="overflow-hidden border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="p-5 space-y-4">
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
            {displayMembers.map((member) => {
              const roleMetadata = getRoleMetadata(member.role as any)
              return (
                <div
                  key={member.id}
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800 relative group"
                  title={`${member.name} (${member.role})`}
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
                </div>
              )
            })}
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
                const roleMetadata = getRoleMetadata(role as any)
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

        {team.is_open && (
          <Button 
            variant="outline"
            className="w-full bg-blue-500/10 border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400"
          >
            Join Team
          </Button>
        )}
      </div>
    </Card>
  )
}
