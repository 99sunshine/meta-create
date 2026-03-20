'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { CommunityFeed } from '@/components/features/explore'
import { CreateModal } from '@/components/features/create'

export default function MainApp() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'team' | 'work'>('team')

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!user.onboarding_complete) {
        router.push('/onboarding')
      }
    }
  }, [loading, user, router])

  if (loading) {
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

  if (!user || !user.onboarding_complete) {
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
        <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  MetaCreate
                </h1>
                <p className="text-sm text-slate-400">
                  Welcome back, {user.name}!
                </p>
              </div>
              <Button 
                onClick={logout}
                variant="outline"
                className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Explore Community
              </h2>
              <p className="text-slate-400">
                Discover amazing works and join exciting teams
              </p>
            </div>
            
            {/* Temporary test buttons for Phase 1 */}
            <div className="flex gap-2">
              <Button
                onClick={() => { setModalType('team'); setModalOpen(true); }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                + Team
              </Button>
              <Button
                onClick={() => { setModalType('work'); setModalOpen(true); }}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                + Work
              </Button>
            </div>
          </div>

          <CommunityFeed />
        </main>
      </div>

      <CreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </div>
  )
}
