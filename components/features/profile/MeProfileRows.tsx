'use client'

import type { TeamWithMembers } from '@/types'
import type { WorkWithCreator } from '@/types'
import { useLocale } from '@/components/providers/LocaleProvider'

/** Matches `Section` on `/profile` — title row + content gap */
export function MeProfileSection({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-[10px] pt-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-white">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Horizontal team pill — same chrome as Me page */
export function MeTeamPill({
  team,
  onPress,
  /** User id used to show Lead vs Member (profile owner or creator being viewed) */
  contextUserId,
}: {
  team: TeamWithMembers
  onPress: () => void
  contextUserId: string
}) {
  const { tr } = useLocale()
  const isLead = team.owner_id === contextUserId
  return (
    <button
      type="button"
      onClick={onPress}
      className="shrink-0 rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-[14px] py-[12px] flex gap-3 items-start text-left hover:bg-white/10 transition-colors"
    >
      <div className="h-9 w-9 rounded-full bg-[rgba(228,109,46,0.2)] flex items-center justify-center text-sm">
        🚀
      </div>
      <div className="flex flex-col gap-[3px]">
        <p className="text-[13px] font-semibold text-white whitespace-nowrap max-w-[120px] truncate">
          {team.name}
        </p>
        <p className="text-[11px] text-white/40">
          {tr('profile.members', { count: team.member_count ?? 1 })}{isLead ? ` · ${tr('profile.lead')}` : ` · ${tr('profile.member')}`}
        </p>
      </div>
    </button>
  )
}

/** Horizontal work card — same chrome as Me page; clickable */
export function MeWorkPreviewCard({ work, onPress }: { work: WorkWithCreator; onPress: () => void }) {
  const { tr } = useLocale()
  const thumb = work.images?.[0]
  const statusColor = 'bg-[rgba(228,109,46,0.15)] text-[#e46d2e]'
  return (
    <button
      type="button"
      onClick={onPress}
      className="shrink-0 w-[200px] rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-[14px] py-[12px] flex flex-col gap-2 text-left hover:bg-white/[0.08] transition-colors"
    >
      {thumb ? (
        <img src={thumb} alt={work.title ?? ''} className="h-[80px] w-full rounded-lg object-cover pointer-events-none" />
      ) : (
        <div className="h-[80px] rounded-lg bg-[rgba(228,109,46,0.15)] pointer-events-none" />
      )}
      <p className="text-[13px] font-semibold text-white leading-tight line-clamp-1">{work.title}</p>
      {work.team && (
        <p className="text-[10px] text-[#e46d2e]/90 truncate">{tr('profile.teamLabel', { name: work.team.name })}</p>
      )}
      <p className="text-[11px] text-white/50 line-clamp-2 leading-snug">{work.description}</p>
      <span className={`self-start rounded-[8px] px-2 py-[3px] text-[10px] font-medium ${statusColor}`}>
        {work.category}
      </span>
    </button>
  )
}
