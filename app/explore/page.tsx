'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import TopNav from '@/components/features/layout/TopNav'
import { CommunityFeed } from '@/components/features/explore'
import { CreateModal } from '@/components/features/create'
import { Button } from '@/components/ui/button'

export default function ExplorePage() {
  const { user, sessionUser, loading, profileLoading } = useAuth()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'team' | 'work'>('team')
  const [feedRefreshKey, setFeedRefreshKey] = useState(0)

  useEffect(() => {
    if (!loading && !sessionUser) {
      router.push('/login')
    }
  }, [loading, sessionUser, router])

  if (loading || profileLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#0c1428' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="stars opacity-40" />
          <div className="stars2 opacity-30" />
        </div>
        <p className="text-white/60 relative z-10 text-sm">Loading…</p>
      </div>
    )
  }

  if (!sessionUser) return null

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#0c1428' }}
    >
      {/* Star background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars opacity-40" />
        <div className="stars2 opacity-30" />
        <div className="stars3 opacity-20" />
      </div>

      <div className="relative z-10">
        <TopNav />

        {/* Incomplete-profile banner */}
        {user && !user.onboarding_complete && (
          <div className="mt-14 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center">
            <span className="text-amber-300 text-sm">
              Your profile is incomplete.{' '}
              <button
                onClick={() => router.push('/onboarding')}
                className="underline text-amber-200 hover:text-white font-medium"
              >
                Complete it now
              </button>{' '}
              to get matched with co-creators.
            </span>
          </div>
        )}

        <main
          className={`mx-auto max-w-6xl px-3 sm:px-6 py-5 sm:py-8 ${
            user && !user.onboarding_complete ? '' : 'mt-14'
          }`}
        >
          {/* Page header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Explore
              </h1>
              <p className="text-sm text-white/50">
                Discover creators, works, and teams — find your next co-creator
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => { setModalType('team'); setModalOpen(true) }}
                size="sm"
                className="flex-1 sm:flex-none text-white text-sm font-medium"
                style={{ backgroundColor: '#3b82f6' }}
              >
                + Team
              </Button>
              <Button
                onClick={() => { setModalType('work'); setModalOpen(true) }}
                size="sm"
                className="flex-1 sm:flex-none text-white text-sm font-medium"
                style={{ backgroundColor: '#a855f7' }}
              >
                + Work
              </Button>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 rounded-lg bg-white/5 animate-pulse border border-white/5"
                  />
                ))}
              </div>
            }
          >
            <CommunityFeed refreshKey={feedRefreshKey} />
          </Suspense>
        </main>
      </div>

      <CreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => { setModalOpen(false); setFeedRefreshKey((k) => k + 1) }}
        type={modalType}
      />
    </div>
  )
}
