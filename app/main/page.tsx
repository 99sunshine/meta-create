'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { CommunityFeed } from '@/components/features/explore'
import { CreateModal } from '@/components/features/create'

export default function MainApp() {
  const { user, sessionUser, loading, profileLoading, logout } = useAuth()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'team' | 'work'>('team')
  const [feedRefreshKey, setFeedRefreshKey] = useState(0)

  const handleCreateSuccess = () => {
    setModalOpen(false)
    setFeedRefreshKey(k => k + 1)
  }

  useEffect(() => {
    if (!loading && !sessionUser) {
      // No session at all → go to login
      router.push('/login')
    }
    // Users who haven't finished onboarding can still browse — they'll see a
    // banner prompt instead of being forced back to /onboarding.
  }, [loading, sessionUser, router])

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>
        <p className="text-white relative z-10">Loading...</p>
      </div>
    )
  }

  if (!sessionUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
      
      <div className="relative z-10">
        {/* Onboarding prompt banner for users who skipped onboarding */}
        {user && !user.onboarding_complete && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center">
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

        <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                  MetaCreate
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 truncate">
                  {user?.name ? `Welcome back, ${user.name}!` : 'Welcome!'}
                </p>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="shrink-0 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 text-xs sm:text-sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8">
          {/* Section header + create buttons */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                Explore Community
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Discover amazing works and join exciting teams
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => { setModalType('team'); setModalOpen(true); }}
                size="sm"
                className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white text-sm"
              >
                + Team
              </Button>
              <Button
                onClick={() => { setModalType('work'); setModalOpen(true); }}
                size="sm"
                className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white text-sm"
              >
                + Work
              </Button>
            </div>
          </div>

          <CommunityFeed refreshKey={feedRefreshKey} />
        </main>
      </div>

      <CreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreateSuccess}
        type={modalType}
      />
    </div>
  )
}
