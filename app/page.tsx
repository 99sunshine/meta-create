'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Home() {
  const { sessionUser, loading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users without waiting for profile fetch.
  // /main already redirects to /onboarding when onboarding_complete is false.
  useEffect(() => {
    if (!loading && sessionUser) {
      router.push('/explore')
    }
  }, [loading, sessionUser, router])

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

  // Unauthenticated user - show landing page
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>
      
      <div className="text-center space-y-8 p-8 relative z-10 max-w-2xl">
        <h1 className="text-6xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          MetaCreate 🚀
        </h1>
        <p className="text-2xl text-slate-300 mb-8">
          Find Your Co-Creator
        </p>
        <p className="text-lg text-slate-400 mb-12">
          Join the global platform connecting students and young professionals for projects, hackathons, and creative ventures
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-14 px-8 text-lg font-semibold">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button 
              variant="outline"
              className="w-full sm:w-auto bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 h-14 px-8 text-lg"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
