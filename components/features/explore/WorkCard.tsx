'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { WorkWithCreator } from '@/types'
import { Card } from '@/components/ui/card'
import { getRoleMetadata } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { SendCollabModal } from '@/components/features/collab/SendCollabModal'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { Role } from '@/types/interfaces/Role'

interface WorkCardProps {
  work: WorkWithCreator
  matchScore?: number
  matchReasons?: string[]
}

export function WorkCard({ work, matchScore, matchReasons }: WorkCardProps) {
  const { user } = useAuth()
  const { locale, tr } = useLocale()
  const [connectOpen, setConnectOpen] = useState(false)
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null)
  const [isTranslatingDescription, setIsTranslatingDescription] = useState(false)
  const translationCacheRef = useRef<Map<string, string>>(new Map())

  const roleMetadata = getRoleMetadata(work.creator.role as Role)
  const RoleIcon = roleMetadata?.icon

  const displayTags = work.tags?.slice(0, 3) || []
  const description = (work.description ?? '').trim()
  const isLikelyChinese = /[\u4e00-\u9fff]/.test(description)
  const shouldTranslate =
    description.length > 0 &&
    ((locale === 'zh' && !isLikelyChinese) || (locale === 'en' && isLikelyChinese))
  const shownDescription = (translatedDescription ?? description).trim()
  const displayDescription = shownDescription.length > 150
    ? `${shownDescription.slice(0, 150)}...`
    : shownDescription

  const canConnect = !!user && user.id !== work.creator.id

  useEffect(() => {
    let cancelled = false
    const fetchTranslatedDescription = async () => {
      if (!shouldTranslate) {
        setTranslatedDescription(null)
        setIsTranslatingDescription(false)
        return
      }

      const cacheKey = `${locale}:${description}`
      const cached = translationCacheRef.current.get(cacheKey)
      if (cached) {
        setTranslatedDescription(cached)
        setIsTranslatingDescription(false)
        return
      }

      setIsTranslatingDescription(true)
      try {
        const response = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: [description], targetLocale: locale }),
        })

        const data = (await response.json()) as { texts?: string[] }
        const next = data?.texts?.[0]?.trim()
        if (!cancelled && next) {
          translationCacheRef.current.set(cacheKey, next)
          setTranslatedDescription(next)
        }
      } catch {
        if (!cancelled) setTranslatedDescription(null)
      } finally {
        if (!cancelled) setIsTranslatingDescription(false)
      }
    }

    void fetchTranslatedDescription()
    return () => {
      cancelled = true
    }
  }, [description, locale, shouldTranslate])

  return (
    <Card
      className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.06)] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-[rgba(255,255,255,0.14)]"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, rgba(25,76,178,0.25) 0%, rgba(244,140,36,0.25) 100%)',
      }}
    >
      {work.images && work.images.length > 0 && (
        <Link href={`/works/${work.id}`} className="block aspect-video w-full overflow-hidden bg-[#0f1733]/60">
          <img
            src={work.images[0]}
            alt={work.title}
            className="h-full w-full object-cover"
          />
        </Link>
      )}

      <div className="space-y-[10px] p-[14px]">
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
          <Link href={`/works/${work.id}`} className="min-w-0 hover:opacity-90 transition-opacity">
            <h3 className="text-lg font-semibold text-white line-clamp-2">{work.title}</h3>
          </Link>
          <span className="shrink-0 rounded-full border border-[rgba(115,27,209,0.45)] bg-[rgba(115,27,209,0.18)] px-2 py-1 text-xs font-medium text-[#d0b0f4]">
            {work.category}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-[#bfbfbf]">
          {displayDescription}
          {isTranslatingDescription ? ` (${tr('explore.translating')})` : ''}
        </p>

        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayTags.map((tag, idx) => (
              <span
                key={idx}
                className="rounded-[12px] border border-[rgba(115,27,209,0.5)] bg-[rgba(115,27,209,0.2)] px-2 py-1 text-xs text-[#b98de8]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: creator info + Connect button */}
        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <Link
            href={`/creator/${work.creator.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
          >
            <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {work.creator.avatar_url ? (
                <img
                  src={work.creator.avatar_url}
                  alt={work.creator.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                work.creator.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{work.creator.name}</span>
              <div className="flex items-center gap-1 text-xs text-[#bfbfbf]">
                {RoleIcon && <RoleIcon className="h-3 w-3 shrink-0" />}
                <span className="truncate">{work.creator.role}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {work.save_count > 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <span>❤️</span>
                <span>{work.save_count}</span>
              </div>
            )}
            <Link
              href={`/works/${work.id}`}
              className="rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-white/15"
            >
              {tr('explore.viewWork')}
            </Link>
            {canConnect && (
              <button
                onClick={() => setConnectOpen(true)}
                className="rounded-[14px] border border-[rgba(228,109,46,0.45)] bg-[rgba(228,109,46,0.12)] px-[14px] py-[6px] text-[12px] font-medium text-[#e46d2e] transition-colors hover:bg-[rgba(228,109,46,0.2)]"
              >
                {tr('creatorCard.connect')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collab modal */}
      {canConnect && (
        <SendCollabModal
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          senderId={user.id}
          receiverId={work.creator.id}
          receiverName={work.creator.name}
          receiverRole={work.creator.role}
          senderRole={user.role ?? undefined}
          senderName={user.name ?? undefined}
          matchScore={matchScore}
        />
      )}
    </Card>
  )
}
