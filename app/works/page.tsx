'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'
import { WorksRepository } from '@/supabase/repos/works'
import type { WorkWithCreator } from '@/types'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

function WorkCard({ work, onClick }: { work: WorkWithCreator; onClick: () => void }) {
  const thumb = work.images?.[0]
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/[0.06] bg-white/[0.04] overflow-hidden hover:border-white/15 transition-colors"
    >
      {thumb && (
        <img src={thumb} alt={work.title} className="w-full h-44 object-cover" />
      )}
      <div className="p-4 space-y-1">
        <p className="text-[15px] font-semibold text-white">{work.title}</p>
        {work.description && (
          <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed">{work.description}</p>
        )}
        {work.category && (
          <span className="inline-block mt-1 text-[11px] text-[#e46d2e] bg-[rgba(228,109,46,0.1)] border border-[rgba(228,109,46,0.3)] rounded-full px-2 py-0.5">
            {work.category}
          </span>
        )}
      </div>
    </button>
  )
}

export default function WorksPage() {
  const router = useRouter()
  const { sessionUser, loading } = useAuth()
  const { tr } = useLocale()
  const [works, setWorks] = useState<WorkWithCreator[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  useEffect(() => {
    if (!sessionUser) return
    setPageLoading(true)
    new WorksRepository()
      .getWorksByUserId(sessionUser.id, 50)
      .then(setWorks)
      .catch(() => setWorks([]))
      .finally(() => setPageLoading(false))
  }, [sessionUser])

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#101837' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06]" style={{ backgroundColor: '#101837' }}>
        <div className="flex items-center justify-between px-5 h-[60px]">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => router.back()} className="text-white/50 hover:text-white text-sm">←</button>
            <p className="text-[15px] font-semibold text-white">我的作品</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              className="rounded-xl px-3 py-1.5 text-[12px] font-medium text-white"
              style={{ backgroundColor: '#E7770F' }}
              onClick={() => router.push('/works/create')}
            >
              + 上传作品
            </button>
          </div>
        </div>
      </div>

      <main className="px-4 pt-4 space-y-4">
        {pageLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[220px] rounded-2xl bg-white/[0.04] animate-pulse" />
          ))
        ) : works.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-white/40 text-sm">还没有上传过作品</p>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: '#E7770F' }}
              onClick={() => router.push('/works/create')}
            >
              上传第一个作品
            </button>
          </div>
        ) : (
          works.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onClick={() => router.push(`/works/${work.id}?returnTo=/works`)}
            />
          ))
        )}
      </main>

      <BottomTabs />
    </div>
  )
}
