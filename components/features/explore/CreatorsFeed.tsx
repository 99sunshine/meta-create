'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProfileRepository } from '@/supabase/repos/profile'
import { CollabRepository } from '@/supabase/repos/collab'
import type { UserProfile } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { CreatorCard } from './CreatorCard'
import { scoreUserMatch } from '@/lib/matching'

const repo = new ProfileRepository()
const collabRepo = new CollabRepository()

type CreatorsFeedProps = {
  limit?: number
  query?: string
  role?: string
  skill?: string
  location?: string
  sort?: 'best' | 'new'
}

function includesInsensitive(haystack: string | null | undefined, needle: string) {
  if (!haystack) return false
  return haystack.toLowerCase().includes(needle)
}

export function CreatorsFeed({
  limit = 60,
  query = '',
  role = '',
  skill = '',
  location = '',
  sort = 'best',
}: CreatorsFeedProps) {
  const { user } = useAuth()
  const [creators, setCreators] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    repo
      .listCreators(limit)
      .then((rows) => {
        if (!mounted) return
        setCreators(rows)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load creators')
        setCreators([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [limit])

  // Batch-load accepted connections so we can hide Connect on already-connected cards
  useEffect(() => {
    if (!user?.id) return
    let mounted = true
    collabRepo.getAcceptedPartnerIds(user.id).then((ids) => {
      if (mounted) setConnectedIds(ids)
    }).catch(() => {})
    return () => { mounted = false }
  }, [user?.id])

  const visible = useMemo(
    () => {
      const q = query.trim().toLowerCase()
      const s = skill.trim().toLowerCase()
      const loc = location.trim().toLowerCase()

      let rows = creators.filter((c) => c.id !== user?.id)

      if (role) rows = rows.filter((c) => String(c.role ?? '') === role)
      if (s) rows = rows.filter((c) => (c.skills ?? []).some((x) => String(x).toLowerCase() === s))
      if (loc) {
        rows = rows.filter((c) => {
          const city = String((c as unknown as Record<string, unknown>).city ?? c.city ?? '')
          return includesInsensitive(city, loc)
        })
      }

      if (q) {
        rows = rows.filter((c) => {
          const name = c.name ?? ''
          const roleText = String(c.role ?? '')
          const city = String((c as unknown as Record<string, unknown>).city ?? c.city ?? '')
          const school = String((c as unknown as Record<string, unknown>).school ?? c.school ?? '')
          const tags = (c.tags ?? []).join(' ')
          const skillsText = (c.skills ?? []).join(' ')
          return (
            includesInsensitive(name, q) ||
            includesInsensitive(roleText, q) ||
            includesInsensitive(city, q) ||
            includesInsensitive(school, q) ||
            includesInsensitive(tags, q) ||
            includesInsensitive(skillsText, q)
          )
        })
      }

      if (sort === 'new') {
        rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return rows
      }

      if (!user) {
        rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return rows
      }

      const scored = rows.map((c) => ({ c, s: scoreUserMatch(user, c).score }))
      scored.sort(
        (a, b) =>
          b.s - a.s ||
          new Date(b.c.created_at).getTime() - new Date(a.c.created_at).getTime(),
      )
      return scored.map((x) => x.c)
    },
    [creators, user?.id, user, query, role, skill, location, sort],
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[128px] rounded-[16px] border border-white/5 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    )
  }

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-white/60">暂无可浏览的创造者</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[14px]">
      {visible.map((creator) => (
        <CreatorCard
          key={creator.id}
          creator={creator}
          connected={connectedIds.has(creator.id)}
        />
      ))}
    </div>
  )
}

