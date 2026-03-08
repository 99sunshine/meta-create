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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  if (!user || !user.onboarding_complete) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-white">
          Welcome, {user.name}! 🎉
        </h1>
        <Button 
          onClick={logout}
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
