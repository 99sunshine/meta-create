'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TeamWithMembers } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import { getRoleMetadata } from '@/constants/roles'
import { JoinTeamDialog } from '@/components/features/teams/JoinTeamDialog'
import { SendCollabModal } from '@/components/features/collab/SendCollabModal'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { Role } from '@/types/interfaces/Role'

interface TeamCardProps {
  team: TeamWithMembers
  currentUserId?: string
  onJoinTeam?: (teamId: string, role: Role) => void | Promise<void>
  isJoining?: boolean
  matchScore?: number
  matchReasons?: string[]
}

export function TeamCard({
  team,
  currentUserId,
  onJoinTeam,
  isJoining = false,
  matchScore,
  matchReasons,
}: TeamCardProps) {
  const { user } = useAuth()
  const { tr } = useLocale()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)

  const displayDescription = team.description
    ? team.description.length > 150
      ? team.description.slice(0, 150) + '...'
      : team.description
    : tr('explore.team.noDescription')

  const displayMembers = team.members.slice(0, 5)
  const hasMoreMembers = team.members.length > 5

  const memberRoles = new Set(team.members.map((m) => m.role))
  const allRoles = ['Visionary', 'Builder', 'Strategist', 'Connector']
  const missingRoles = allRoles.filter((role) => !memberRoles.has(role))
  const lookingForRoles = team.looking_for_roles || missingRoles
  const localizeRole = (role: string) => {
    const key = `roles.${role.toLowerCase()}`
    const translated = tr(key)
    return translated === key ? role : translated
  }

  const isAlreadyMember = currentUserId
    ? team.members.some((member) => member.id === currentUserId)
    : false

  // The person to "Connect" with is the team owner
  const ownerId = team.owner_id
  const ownerMember = team.members.find((m) => m.id === ownerId)
  const canConnect = !!user && !!ownerId && user.id !== ownerId

  const handleJoinClick = () => {
    if (onJoinTeam) setDialogOpen(true)
  }

  const handleJoinConfirm = async (role: Role) => {
    if (onJoinTeam) {
      await onJoinTeam(team.id, role)
      setDialogOpen(false)
    }
  }

  return (
    <Card
      className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.06)] p-[14px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-[rgba(255,255,255,0.14)]"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, rgba(25,76,178,0.25) 0%, rgba(244,140,36,0.25) 100%)',
      }}
    >
      <div className="space-y-[10px]">
        {/* Match score badge */}
        {matchScore !== undefined && matchScore > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(231,119,15,0.15)', color: '#f5a623', border: '1px solid rgba(231,119,15,0.3)' }}
            >
              🎯 {tr('explore.matchPercent', { score: matchScore })}
            </span>
            {matchReasons?.map((r) => (
              <span key={r} className="text-xs text-white/40">{r}</span>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <Link href={`/teams/${team.id}`} className="flex min-w-0 items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white line-clamp-1">{team.name}</h3>
              <span className="text-xs text-[#bfbfbf]">
                {tr('explore.team.memberCount', { current: team.member_count, max: team.max_members })}
              </span>
            </div>
          </Link>
          <span className="shrink-0 rounded-full border border-[rgba(115,27,209,0.45)] bg-[rgba(115,27,209,0.18)] px-2 py-1 text-xs font-medium text-[#d0b0f4]">
            {team.category}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-[#bfbfbf]">{displayDescription}</p>

        {/* Members row */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {displayMembers.map((member) => (
              <Link
                key={member.id}
                href={`/creator/${member.id}`}
                title={`${member.name} (${localizeRole(member.role)})`}
                className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium border-2 border-slate-800 hover:opacity-80 transition-opacity overflow-hidden"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1b2548] bg-white/10 text-xs font-medium text-white/75">
                +{team.members.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Looking for roles */}
        {lookingForRoles.length > 0 && (
          <div className="border-t border-white/10 pt-2">
            <p className="mb-2 text-xs text-white/55">{tr('explore.team.lookingFor')}</p>
            <div className="flex flex-wrap gap-2">
              {lookingForRoles.slice(0, 3).map((role, idx) => {
                const roleMetadata = getRoleMetadata(role as Role)
                const RoleIcon = roleMetadata?.icon
                return (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-[12px] border border-[rgba(115,27,209,0.5)] bg-[rgba(115,27,209,0.2)] px-2 py-1 text-xs text-[#b98de8]"
                  >
                    {RoleIcon && <RoleIcon className="h-3 w-3" />}
                    {localizeRole(role)}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/teams/${team.id}`}
            className={`rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-white/15 ${
              team.is_open && onJoinTeam ? '' : 'flex-1 text-center text-sm py-2'
            }`}
          >
            {tr('explore.viewTeam')}
          </Link>
          {team.is_open && onJoinTeam && (
            <>
              <Button
                variant="outline"
                onClick={handleJoinClick}
                disabled={isJoining}
                className="flex-1 border-[rgba(228,109,46,0.45)] bg-[rgba(228,109,46,0.15)] text-[#e46d2e] hover:border-[rgba(228,109,46,0.65)] hover:bg-[rgba(228,109,46,0.2)]"
              >
                {isJoining ? tr('explore.joiningTeam') : tr('explore.joinTeam')}
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

          {canConnect && (
            <button
              onClick={() => setConnectOpen(true)}
                className={`rounded-[14px] border border-[rgba(228,109,46,0.45)] bg-[rgba(228,109,46,0.12)] px-[14px] py-[6px] text-[12px] font-medium text-[#e46d2e] transition-colors hover:bg-[rgba(228,109,46,0.2)] ${
                team.is_open && onJoinTeam ? '' : 'w-full text-sm py-2'
              }`}
            >
                {tr('creatorCard.connect')}
            </button>
          )}
        </div>
      </div>

      {/* Collab modal */}
      {canConnect && ownerId && (
        <SendCollabModal
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          senderId={user!.id}
          receiverId={ownerId}
          receiverName={ownerMember?.name ?? team.name}
          receiverRole={ownerMember?.role}
          senderRole={user?.role ?? undefined}
          senderName={user?.name ?? undefined}
          matchScore={matchScore}
        />
      )}
    </Card>
  )
}
