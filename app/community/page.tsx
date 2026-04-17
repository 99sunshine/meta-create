'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BottomTabs from '@/components/features/layout/BottomTabs'

export default function CommunityPage() {
  const router = useRouter()
  const { sessionUser, loading, profileLoading } = useAuth()

  useEffect(() => {
    if (!loading && !sessionUser) router.push('/login')
  }, [loading, sessionUser, router])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#101837' }}>
        <p className="text-white/60 text-sm">Loading…</p>
      </div>
    )
  }

  if (!sessionUser) return null

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#101837' }}>
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:px-6">
        <h1 className="text-2xl font-bold text-white mb-2">Community</h1>
        <p className="text-sm text-white/50">
          该页面先做 UI 占位以对齐 Figma 导航；内容流功能按 P0 优先级暂不开发。
        </p>
      </main>
      <BottomTabs />
    </div>
  )
}

