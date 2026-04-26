'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { WorkWithCreator } from '@/types'
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

export function WorkCard({ work, matchScore, matchReasons }: WorkCardProps) {
  const { user } = useAuth()
  const { locale, tr } = useLocale()
  const [connectOpen, setConnectOpen] = useState(false)
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null)
  const [isTranslatingDescription, setIsTranslatingDescription] = useState(false)
  const translationCacheRef = useRef<Map<string, string>>(new Map())

  const roleMetadata = getRoleMetadata(work.creator.role as Role)
  const RoleIcon = roleMetadata?.icon
  const localizedRole = (() => {
    const key = `roles.${String(work.creator.role ?? '').toLowerCase()}`
    const translated = tr(key)
    return translated === key ? String(work.creator.role ?? '') : translated
  })()

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
    <>
      <div
        className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.06)] p-[14px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-[rgba(255,255,255,0.14)]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 100%), linear-gradient(180deg, rgba(25,76,178,0.25) 0%, rgba(244,140,36,0.25) 100%)',
        }}
      >
        <div className="flex w-full items-center gap-[10px]">
          <Link href={`/works/${work.id}`} className="shrink-0">
            {work.images && work.images.length > 0 ? (
              <img
                src={work.images[0]}
                alt={work.title}
                className="h-[44px] w-[44px] rounded-[22px] object-cover bg-white/10"
              />
            ) : (
              <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[22px] bg-white/10 text-sm font-semibold text-white/85">
                {initialsFromName(work.title)}
              </div>
            )}
          </Link>

          <Link href={`/works/${work.id}`} className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-white">{work.title}</p>
            <p className="truncate text-[12px] text-[#bfbfbf]">{work.category}</p>
          </Link>

          {matchScore !== undefined && matchScore > 0 ? (
            <div className="shrink-0 rounded-[10px] border border-[rgba(228,109,46,0.5)] bg-[rgba(228,109,46,0.15)] px-2 py-1">
              <p className="whitespace-nowrap text-[12px] font-semibold text-[#e46d2e]">{Math.round(matchScore)}%</p>
            </div>
          ) : null}
        </div>

        <p className="mt-[10px] line-clamp-2 text-[12px] text-[#bfbfbf]">
          {displayDescription}
          {isTranslatingDescription ? ` (${tr('explore.translating')})` : ''}
        </p>

        {displayTags.length > 0 ? (
          <div className="mt-[10px] flex items-center gap-[6px] overflow-x-auto">
            {displayTags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="shrink-0 rounded-[12px] border border-[rgba(115,27,209,0.5)] bg-[rgba(115,27,209,0.2)] px-2 py-1 text-[11px] text-[#b98de8]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-[10px] flex items-center gap-2">
          <Link
            href={`/creator/${work.creator.id}`}
            className="flex min-w-0 flex-1 items-center gap-2 hover:opacity-85 transition-opacity"
          >
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10 text-xs font-medium text-white">
              {work.creator.avatar_url ? (
                <img src={work.creator.avatar_url} alt={work.creator.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">{work.creator.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-white">{work.creator.name}</p>
              <p className="truncate text-[11px] text-[#bfbfbf]">
                {RoleIcon ? <RoleIcon className="mr-1 inline h-3 w-3 align-[-1px]" /> : null}
                {localizedRole}
              </p>
            </div>
          </Link>

          <Link
            href={`/works/${work.id}`}
            className="shrink-0 rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-white/15"
          >
            {tr('explore.viewWork')}
          </Link>
          {canConnect ? (
            <button
              onClick={() => setConnectOpen(true)}
              className="shrink-0 rounded-[14px] bg-white/10 px-[14px] py-[6px] text-[12px] font-medium text-white transition-colors hover:bg-white/15"
            >
              {tr('creatorCard.connect')}
            </button>
          ) : null}
        </div>
      </div>

      {canConnect ? (
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
      ) : null}
    </>
  )
}
