'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
      
      <div className="text-center space-y-6 p-8 relative z-10">
        <h1 className="text-5xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Welcome, {user.name}! 🎉
        </h1>
        <p className="text-xl text-slate-400">
          Your creator profile is live
        </p>
        <Button 
          onClick={logout}
          variant="outline"
          className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 h-12 px-8"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
