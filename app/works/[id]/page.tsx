'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { WorksRepository } from '@/supabase/repos/works'
import type { WorkWithCreator } from '@/types'
import { trackEvent } from '@/lib/analytics'

function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

function WorkDetailInner() {
  const { id: workId } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sessionUser, loading } = useAuth()
  const [work, setWork] = useState<WorkWithCreator | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const returnTo = safeReturnPath(searchParams.get('returnTo'))

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (!workId) return
    setPageLoading(true)
    new WorksRepository()
      .getWorkById(workId)
      .then((w) => {
        if (!w) setNotFound(true)
        else {
          setWork(w)
          trackEvent('work_viewed', { work_id: workId })
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false))
  }, [workId])

  const handleBack = () => {
    if (returnTo) router.push(returnTo)
    else router.back()
  }

  if (loading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">Loading…</p>
      </div>
    )
  }

  if (notFound || !work) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/50 text-sm">作品不存在或无权查看</p>
        <button type="button" className="text-[#e46d2e] text-sm" onClick={handleBack}>
          ← 返回
        </button>
      </div>
    )
  }

  const creator = work.creator
  const images = work.images ?? []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101837' }}>
      <div className="h-14 flex items-center gap-3 px-4 border-b border-white/8 sticky top-0 z-10" style={{ backgroundColor: '#101837' }}>
        <button type="button" className="text-white/60 hover:text-white p-1 text-xl" onClick={handleBack} aria-label="返回">
          ←
        </button>
        <p className="text-base font-semibold text-white truncate flex-1">{work.title}</p>
      </div>

      <div className="px-5 pb-28 space-y-5 pt-4">
        {images.length > 0 && (
          <div className="space-y-2">
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-full max-h-[420px] rounded-2xl border border-white/10 object-cover bg-white/5"
              />
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[rgba(228,109,46,0.15)] text-[#e46d2e] border border-[rgba(228,109,46,0.3)]">
              {work.category}
            </span>
            {work.team_id && work.team && (
              <Link
                href={`/teams/${work.team_id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                className="text-xs text-[#e46d2e] underline underline-offset-2"
              >
                队伍 · {work.team.name}
              </Link>
            )}
          </div>
          {work.description && (
            <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{work.description}</p>
          )}
          {creator?.id && (
            <div className="pt-2 border-t border-white/10">
              <p className="text-[11px] text-white/40 mb-1">创作者</p>
              <Link href={`/creator/${creator.id}`} className="text-sm font-medium text-white hover:text-[#e46d2e] transition-colors">
                {creator.name ?? 'Creator'}
              </Link>
            </div>
          )}
          {(work.links ?? []).filter(Boolean).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {(work.links ?? []).filter(Boolean).map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#e46d2e] underline"
                >
                  链接 {i + 1}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WorkDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
          <p className="text-white/50 text-sm">Loading…</p>
        </div>
      }
    >
      <WorkDetailInner />
    </Suspense>
  )
}
