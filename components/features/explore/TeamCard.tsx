'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TeamWithMembers } from '@/types'
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

function initialsFromName(name: string | null | undefined) {
  const safe = (name ?? '').trim()
  if (!safe) return '?'
  return safe
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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
  const subtitleText = `${tr('explore.team.memberCount', { current: team.member_count, max: team.max_members })} · ${team.category}`

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
    <>
      <div
        className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.06)] p-[14px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-[rgba(255,255,255,0.14)]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, rgba(25,76,178,0.25) 0%, rgba(244,140,36,0.25) 100%)',
        }}
      >
        <div className="flex w-full items-center gap-[10px]">
          <Link href={`/teams/${team.id}`} className="shrink-0">
            <div className="relative flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-[22px] bg-white/10 text-sm font-semibold text-white/85">
              {initialsFromName(team.name)}
              <span className="absolute -bottom-[2px] -right-[2px] rounded-full bg-[rgba(25,76,178,0.95)] p-[2px]">
                <Users className="h-3 w-3 text-white" />
              </span>
            </div>
          </Link>

          <Link href={`/teams/${team.id}`} className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-white">{team.name}</p>
            <p className="truncate text-[12px] text-[#bfbfbf]">{subtitleText}</p>
          </Link>

          {matchScore !== undefined && matchScore > 0 ? (
            <div className="shrink-0 rounded-[10px] border border-[rgba(228,109,46,0.5)] bg-[rgba(228,109,46,0.15)] px-2 py-1">
              <p className="whitespace-nowrap text-[12px] font-semibold text-[#e46d2e]">{Math.round(matchScore)}%</p>
            </div>
          ) : null}
        </div>

        <p className="mt-[10px] line-clamp-2 text-[12px] text-[#bfbfbf]">{displayDescription}</p>

        {lookingForRoles.length > 0 ? (
          <div className="mt-[10px] flex items-center gap-[6px] overflow-x-auto">
            {lookingForRoles.slice(0, 3).map((role, idx) => {
              const roleMetadata = getRoleMetadata(role as Role)
              const RoleIcon = roleMetadata?.icon
              return (
                <span
                  key={`${role}-${idx}`}
                  className="flex shrink-0 items-center gap-1 rounded-[12px] border border-[rgba(115,27,209,0.5)] bg-[rgba(115,27,209,0.2)] px-2 py-1 text-[11px] text-[#b98de8]"
                >
                  {RoleIcon ? <RoleIcon className="h-3 w-3" /> : null}
                  {localizeRole(role)}
                </span>
              )
            })}
          </div>
        ) : null}

        <div className="mt-[10px] flex items-center gap-2">
          <p className="flex-1 truncate text-[11px] text-[#e88dba]">
            {matchReasons && matchReasons.length > 0 ? matchReasons[0] : tr('explore.team.lookingFor')}
          </p>

          <Link
            href={`/teams/${team.id}`}
            className="shrink-0 rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-white/15"
          >
            {tr('explore.viewTeam')}
          </Link>

          {team.is_open && onJoinTeam ? (
            <>
              <Button
                variant="outline"
                onClick={handleJoinClick}
                disabled={isJoining}
                className="shrink-0 rounded-[14px] border border-[rgba(228,109,46,0.45)] bg-[rgba(228,109,46,0.15)] px-[14px] py-[6px] text-[12px] font-medium text-[#e46d2e] hover:border-[rgba(228,109,46,0.65)] hover:bg-[rgba(228,109,46,0.2)]"
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
          ) : null}

          {canConnect ? (
            <button
              onClick={() => setConnectOpen(true)}
              className="shrink-0 rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-white/15"
            >
              {tr('creatorCard.connect')}
            </button>
          ) : null}
        </div>

        {displayMembers.length > 0 ? (
          <div className="mt-[10px] flex items-center gap-2">
            <div className="flex -space-x-2">
              {displayMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/creator/${member.id}`}
                  title={`${member.name} (${localizeRole(member.role)})`}
                  className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#1b2548] bg-white/10 text-xs font-medium text-white hover:opacity-85"
                >
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">{member.name.charAt(0).toUpperCase()}</span>
                  )}
                </Link>
              ))}
              {hasMoreMembers ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1b2548] bg-white/10 text-xs font-medium text-white/75">
                  +{team.members.length - 5}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {canConnect && ownerId ? (
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
      ) : null}
    </>
  )
}
