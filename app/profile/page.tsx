'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { useCreateFlow } from '@/components/providers/CreateFlowProvider'
import { Button } from '@/components/ui/button'
import { createClient } from '@/supabase/utils/client'
import type { UserProfile } from '@/types'
import type { TeamWithMembers } from '@/types'
import { TeamsRepository } from '@/supabase/repos/teams'
import { WorksRepository } from '@/supabase/repos/works'
import type { WorkWithCreator } from '@/types'
import { MeProfileSection, MeTeamPill, MeWorkPreviewCard } from '@/components/features/profile/MeProfileRows'
import { skillColorClass } from '@/constants/skills'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { getLocalizedTrackLabel } from '@/constants/taxonomy'
import { useLocalizedManifesto, useLocalizedSkills, useLocalizedTags } from '@/hooks/useLocalizedText'

// ── Skill chip 4-color system (Figma Me page) ────────────────────────────────
const SKILL_COLORS = {
  teal: 'bg-[rgba(15,134,136,0.2)] border-[rgba(15,134,136,0.5)] text-[#70b7b8]',
  purple: 'bg-[rgba(115,27,209,0.2)] border-[rgba(115,27,209,0.5)] text-[#b98de8]',
  orange: 'bg-[rgba(223,112,21,0.2)] border-[rgba(223,112,21,0.5)] text-[#efb88a]',
  blue: 'bg-[rgba(21,55,223,0.2)] border-[rgba(21,55,223,0.5)] text-[#8a9bef]',
}

function skillColor(s: string): string {
  return SKILL_COLORS[skillColorClass(s)]
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, src, size = 80 }: { name: string; src?: string | null; size?: number }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#E7770F,#f5a623)',
        fontSize: size * 0.28,
      }}
    >
      {initials}
    </div>
  )
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: UserProfile
  onClose: () => void
  onSaved: () => void
}) {
  const { tr } = useLocale()
  const { refreshProfile } = useAuth()
  const supabase = createClient()

  const [name, setName] = useState(profile.name ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [school, setSchool] = useState(profile.school ?? '')
  const [manifesto, setManifesto] = useState(profile.manifesto ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `avatars/${profile.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
      if (upErr) throw new Error(upErr.message)
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // Save avatar_url to profile immediately
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!res.ok) throw new Error(tr('profile.avatarSaveFailed'))
      setAvatarPreview(publicUrl)
      await refreshProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('profile.avatarUploadFailed'))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, school, manifesto }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? tr('profile.saveFailed'))
      }
      await refreshProfile()
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('profile.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const initials = (name || profile.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 p-5 mb-2"
        style={{ backgroundColor: '#101837' }}>
        <h2 className="mb-4 text-base font-bold text-white">{tr('profile.editProfile')}</h2>

        {/* Avatar upload */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-white font-semibold text-lg">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              ) : initials}
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:border-white/40 hover:text-white transition-colors">
              {avatarUploading ? tr('profile.avatarUploading') : tr('profile.changeAvatar')}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
            <p className="mt-1 text-[10px] text-white/30">{tr('profile.avatarHint')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: tr('profile.name'), value: name, setter: setName, placeholder: tr('profile.yourName') },
            { label: tr('profile.city'), value: city, setter: setCity, placeholder: tr('profile.cityExample') },
            { label: tr('profile.school'), value: school, setter: setSchool, placeholder: tr('profile.schoolExample') },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-white/50">{label}</label>
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-white/50">{tr('profile.manifestoLabel')}</label>
            <textarea
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              rows={3}
              placeholder={tr('profile.manifestoQuestion')}
              className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/60 hover:text-white">{tr('common.cancel')}</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}
            className="text-white font-medium" style={{ backgroundColor: '#E7770F' }}>
            {saving ? tr('profile.saving') : tr('common.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter()
  const { locale, tr } = useLocale()
  const { subscribeEntityCreated } = useCreateFlow()
  const { user, sessionUser, loading, profileLoading, profileError, logout } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [myTeams, setMyTeams] = useState<TeamWithMembers[]>([])
  const [myWorks, setMyWorks] = useState<WorkWithCreator[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const encodedProfileReturn = encodeURIComponent('/profile')
  const profile = user
  const skills = (profile?.skills ?? []) as string[]
  const tags = (profile?.tags ?? []) as string[]
  const localizedSkills = useLocalizedSkills(skills, locale)
  const localizedTags = useLocalizedTags(tags, locale)
  const localizedManifesto = useLocalizedManifesto(profile?.manifesto ?? '', locale)
  const localizedTrack = profile?.hackathon_track ? getLocalizedTrackLabel(profile.hackathon_track, locale) : null

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (!sessionUser) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDataLoading(true)
    Promise.all([
      new TeamsRepository().getTeamsForUser(sessionUser.id, 20).catch(() => []),
      new WorksRepository().getWorksByUserId(sessionUser.id, 10).catch(() => []),
    ])
      .then(([teams, works]) => {
        setMyTeams(teams as TeamWithMembers[])
        setMyWorks(works as WorkWithCreator[])
      })
      .finally(() => setDataLoading(false))
  }, [sessionUser])

  useEffect(() => {
    if (!sessionUser) return
    return subscribeEntityCreated(() => {
      void new WorksRepository()
        .getWorksByUserId(sessionUser.id, 10)
        .then((works) => setMyWorks(works))
        .catch(() => {})
    })
  }, [sessionUser, subscribeEntityCreated])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">{tr('common.loading')}</p>
      </div>
    )
  }

  if (!sessionUser) return null

  const needsOnboarding = profile?.onboarding_complete === false
  const displayName = profile?.name?.trim() || sessionUser.email?.split('@')[0] || tr('common.creator')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Top bar (no hamburger) */}
      <div className="h-[60px] flex items-center justify-between px-5" style={{ backgroundColor: '#101837' }}>
        <p className="text-[15px] font-semibold text-white">{tr('profile.me')}</p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {needsOnboarding && (
            <button
              type="button"
              onClick={() => router.push('/onboarding')}
              className="text-xs text-amber-300 border border-amber-500/40 bg-amber-500/10 px-3 py-1 rounded-xl"
            >
              {tr('profile.completeProfile')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
            aria-label={tr('profile.editProfile')}
            title={tr('profile.edit')}
          >
            ✎
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-28">
        {profileError && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-300">{tr('common.profileLoadFailed')}</p>
          </div>
        )}

        {/* ── Profile Header ── */}
        <div className="flex gap-[14px] items-center">
          <Avatar name={displayName} src={profile?.avatar_url} size={80} />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <p className="text-[20px] font-semibold text-white leading-tight truncate">{displayName}</p>
            <div className="flex flex-wrap gap-2">
              {profile?.school && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">
                  {profile.school}
                </span>
              )}
              {profile?.city && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">
                  {profile.city}
                </span>
              )}
              {profile?.hackathon_track && (
                <span className="rounded-[10px] bg-white/10 px-2 py-[3px] text-[11px] text-[#e6e6e6]">
                  {tr('profile.track')}: {localizedTrack}
                </span>
              )}
            </div>
            {localizedManifesto && (
              <p className="text-[12px] italic text-[#e6e6e6] leading-snug line-clamp-2">
                &ldquo;{localizedManifesto}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* ── Building next (manifesto vision) ── */}
        {localizedManifesto && (
          <MeProfileSection title={tr('profile.buildingNext')}>
            <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-[14px] py-[12px]">
              <p className="text-[13px] text-[#d1d1d1] leading-relaxed">{localizedManifesto}</p>
            </div>
          </MeProfileSection>
        )}

        {/* ── Looking for (tags in pink) ── */}
        {localizedTags.length > 0 && (
          <MeProfileSection title={tr('profile.lookingFor')}>
            <div className="flex flex-wrap gap-[6px]">
              {localizedTags.map((t) => (
                <span
                  key={t}
                  className="rounded-[12px] border border-[rgba(209,27,115,0.5)] bg-[rgba(209,27,115,0.2)] px-[10px] py-[5px] text-[12px] text-[#e88dba]"
                >
                  {t}
                </span>
              ))}
            </div>
          </MeProfileSection>
        )}

        {/* ── Skills (4-color system) ── */}
        {localizedSkills.length > 0 && (
          <MeProfileSection title={tr('profile.skills')}>
            <div className="flex flex-wrap gap-[6px]">
              {localizedSkills.map((s, idx) => (
                <span
                  key={`${skills[idx] ?? s}-${idx}`}
                  className={`rounded-[12px] border px-[10px] py-[5px] text-[12px] ${skillColor(skills[idx] ?? s)}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </MeProfileSection>
        )}

        {/* ── My Teams ── */}
        <MeProfileSection
          title={tr('profile.myTeams')}
          action={
            <button
              type="button"
              className="text-[12px] text-white/40"
              onClick={() => router.push('/teams')}
            >
              {tr('profile.viewAll')}
            </button>
          }
        >
          {dataLoading ? (
            <div className="flex gap-3">
              {[1, 2].map((i) => <div key={i} className="h-[72px] w-[150px] rounded-[12px] bg-white/5 animate-pulse shrink-0" />)}
            </div>
          ) : myTeams.length === 0 ? (
            <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-4 py-3 flex items-center justify-between">
              <p className="text-[13px] text-white/40">{tr('profile.noTeams')}</p>
              <button
                type="button"
                className="text-[12px] text-[#e46d2e]"
                onClick={() => router.push('/teams/create')}
              >
                {tr('profile.createTeam')}
              </button>
            </div>
          ) : (
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {myTeams.map((team) => (
                <MeTeamPill
                  key={team.id}
                  team={team}
                  contextUserId={sessionUser.id}
                  onPress={() => router.push(`/teams/${team.id}?returnTo=${encodedProfileReturn}`)}
                />
              ))}
              <button
                type="button"
                onClick={() => router.push('/teams/create')}
                className="shrink-0 rounded-[12px] border-[0.5px] border-dashed border-white/20 px-[14px] py-[12px] text-[12px] text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
              >
                {tr('profile.newTeam')}
              </button>
            </div>
          )}
        </MeProfileSection>

        {/* ── My Works / Projects ── */}
        <MeProfileSection
          title={tr('profile.myWorks')}
          action={
            <button type="button" className="text-[12px] text-white/40" onClick={() => router.push('/works')}>
              {tr('profile.viewAll')}
            </button>
          }
        >
          {dataLoading ? (
            <div className="flex gap-3">
              {[1, 2].map((i) => <div key={i} className="h-[160px] w-[200px] rounded-[12px] bg-white/5 animate-pulse shrink-0" />)}
            </div>
          ) : myWorks.length === 0 ? (
            <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-4 py-3">
              <p className="text-[13px] text-white/40">{tr('profile.noWorks')}</p>
            </div>
          ) : (
            <div className="flex gap-[10px] overflow-x-auto pb-1">
              {myWorks.map((work) => (
                <MeWorkPreviewCard
                  key={work.id}
                  work={work}
                  onPress={() => router.push(`/works/${work.id}?returnTo=${encodedProfileReturn}`)}
                />
              ))}
            </div>
          )}
        </MeProfileSection>

        {/* ── Account ── */}
        <MeProfileSection title={tr('profile.account')}>
          <div className="rounded-[12px] border-[0.5px] border-white/[0.06] bg-white/[0.04] px-[14px] py-[12px] space-y-1">
            <p className="text-[13px] text-white/50">
              {tr('profile.email')}: <span className="text-white/80">{profile?.email ?? sessionUser.email}</span>
            </p>
            <p className="text-[13px] text-white/50">
              {tr('profile.memberSince')}:{' '}
              <span className="text-white/80">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US') : '—'}
              </span>
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => router.push('/onboarding')}
            >
              {tr('profile.restartOnboarding')}
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-sm text-red-400 hover:bg-red-500/15 transition-colors"
              onClick={logout}
            >
              {tr('profile.logout')}
            </button>
          </div>
        </MeProfileSection>

      </div>

      <BottomTabs />

      {editOpen && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
