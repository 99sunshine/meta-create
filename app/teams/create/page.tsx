'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { TeamsRepository } from '@/supabase/repos/teams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trackEvent } from '@/lib/analytics'
import { ROLES } from '@/constants/roles'

const TRACKS = [
  'AI & Machine Learning', 'Web3 & DeFi', 'Climate Tech', 'HealthTech',
  'EdTech', 'Gaming & Metaverse', 'Creator Economy', 'Social Impact', 'Open Track',
]

export default function CreateTeamPage() {
  const router = useRouter()
  const { sessionUser, loading, user } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [track, setTrack] = useState('')
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [maxMembers, setMaxMembers] = useState(4)
  const [externalChatLink, setExternalChatLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  if (loading) return null
  if (!sessionUser) return null

  const toggleRole = (role: string) => {
    setLookingFor((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) { setError('队伍名称不能为空'); return }
    setSaving(true)
    setError('')
    try {
      const repo = new TeamsRepository()
      const team = await repo.createTeam(
        {
          name: name.trim(),
          description: description.trim() || null,
          category: track || 'Open Track',
          looking_for_roles: lookingFor.length > 0 ? lookingFor : null,
          max_members: maxMembers,
          is_open: true,
          external_chat_link: externalChatLink.trim() || null,
          event_id: null,
        },
        sessionUser.id,
      )
      trackEvent('team_created', { team_id: team.id, track, role: user?.role ?? null })
      router.push(`/teams/${team.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/8 sticky top-0 z-10" style={{ backgroundColor: '#101837' }}>
        <button type="button" className="text-white/60 hover:text-white p-1 text-xl" onClick={() => router.back()}>←</button>
        <p className="text-base font-semibold text-white">创建队伍</p>
      </div>

      <div className="px-5 py-5 pb-28 max-w-lg mx-auto space-y-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-white text-sm">队伍名称 *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nebula Studio"
            className="bg-white/8 border-white/15 text-white placeholder-white/30 focus:border-[#e46d2e]"
            maxLength={40}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-white text-sm">描述</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="你们在做什么？有什么愿景？"
            className="w-full rounded-xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-[#e46d2e] focus:outline-none resize-none"
            maxLength={300}
          />
        </div>

        {/* Track */}
        <div className="flex flex-col gap-2">
          <Label className="text-white text-sm">赛道</Label>
          <div className="flex flex-wrap gap-2">
            {TRACKS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrack(track === t ? '' : t)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  track === t
                    ? 'bg-[#E7770F] text-white'
                    : 'bg-white/10 border border-white/15 text-white/60 hover:border-[#E7770F]/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Looking for */}
        <div className="flex flex-col gap-2">
          <Label className="text-white text-sm">招募角色</Label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => {
              const Icon = role.icon
              return (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => toggleRole(role.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    lookingFor.includes(role.name)
                      ? 'bg-[rgba(209,27,115,0.2)] border border-[rgba(209,27,115,0.5)] text-[#e88dba]'
                      : 'bg-white/10 border border-white/15 text-white/60 hover:border-pink-500/30'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {role.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Max members */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-white text-sm">最大成员数: {maxMembers}</Label>
          <input
            type="range"
            min={2}
            max={8}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
            className="w-full accent-[#E7770F]"
          />
          <div className="flex justify-between text-xs text-white/30">
            <span>2</span><span>8</span>
          </div>
        </div>

        {/* External chat link */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-white text-sm">对外群链接（可选）</Label>
          <Input
            value={externalChatLink}
            onChange={(e) => setExternalChatLink(e.target.value)}
            placeholder="飞书/微信群/Discord…"
            className="bg-white/8 border-white/15 text-white placeholder-white/30 focus:border-[#e46d2e]"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="w-full py-3 text-white font-semibold rounded-xl disabled:opacity-50"
          style={{ backgroundColor: '#E7770F' }}
        >
          {saving ? '创建中…' : '创建队伍 🚀'}
        </Button>
      </div>
    </div>
  )
}
