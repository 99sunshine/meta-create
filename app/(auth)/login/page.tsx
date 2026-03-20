'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendMagicLink, signInWithPassword } from '@/supabase/auth'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuthMethod = 'password' | 'magic'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Handle redirect after auth state updates
  useEffect(() => {
    if (!loading && user && isLoggingIn) {
      // Auth state updated, redirect based on onboarding status
      if (user.onboarding_complete) {
        router.push('/main')
      } else {
        router.push('/onboarding')
      }
    }
  }, [loading, user, isLoggingIn, router])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setError('')

    try {
      await signInWithPassword(email, password)
      // Don't redirect here - let useEffect handle it after auth state updates
    } catch (err) {
      setError((err as Error).message)
      setIsLoggingIn(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setError('')

    try {
      await sendMagicLink(email)
      setMagicLinkSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="stars"></div>
          <div className="stars2"></div>
          <div className="stars3"></div>
        </div>

        <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <CardTitle className="text-white text-2xl">Check your email!</CardTitle>
            <CardDescription className="text-slate-400 text-base mt-2">
              We sent a magic link to <span className="text-white font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 text-center">
              Click the link in the email to sign in. You can close this tab.
            </p>
            <Button
              onClick={() => setMagicLinkSent(false)}
              variant="outline"
              className="w-full mt-4 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Welcome Back 👋
          </CardTitle>
          <CardDescription className="text-slate-400 text-lg">
            Sign in to MetaCreate
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Method Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-lg">
            <button
              onClick={() => setMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'password'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'magic'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={method === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg"
              />
            </div>

            {method === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-base font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoggingIn || loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
            >
              {(isLoggingIn || loading) ? 'Loading...' : method === 'magic' ? 'Send Magic Link' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
