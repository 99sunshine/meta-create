'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendMagicLink, signInWithPassword } from '@/supabase/auth'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthBackground } from '@/components/features/onboarding'

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
      <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
        <AuthBackground />

        <div className="w-full max-w-sm flex flex-col items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-figma-accent/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-figma-text-primary text-2xl font-bold text-center">Check your email!</h1>
          <p className="text-figma-text-secondary text-center text-base">
            We sent a magic link to <span className="text-figma-text-primary font-medium">{email}</span>
          </p>
          <p className="text-sm text-figma-text-tertiary text-center">
            Click the link in the email to sign in. You can close this tab.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="w-56 py-4 bg-figma-input-bg border border-figma-input-border rounded-full text-figma-text-primary hover:bg-figma-input-bg/80 transition-all"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-figma-bg p-4 relative overflow-hidden">
      <AuthBackground />

      <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-figma-text-primary text-3xl font-bold mb-2">
            Welcome Back 👋
          </h1>
          <p className="text-figma-text-secondary text-lg">
            Sign in to MetaCreate
          </p>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-6">
          {/* Method Toggle */}
          <div className="flex gap-2 p-1 bg-figma-input-bg rounded-lg">
            <button
              onClick={() => setMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'password'
                  ? 'bg-figma-accent text-figma-text-primary'
                  : 'text-figma-text-tertiary hover:text-figma-text-primary'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'magic'
                  ? 'bg-figma-accent text-figma-text-primary'
                  : 'text-figma-text-tertiary hover:text-figma-text-primary'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={method === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-figma-text-primary text-sm leading-[14px]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-4 px-4 bg-figma-input-bg border border-figma-input-border rounded-lg text-figma-text-primary placeholder:text-figma-text-tertiary text-sm h-auto"
              />
            </div>

            {method === 'password' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-figma-text-primary text-sm leading-[14px]">
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
                  className="w-full py-4 px-4 bg-figma-input-bg border border-figma-input-border rounded-lg text-figma-text-primary placeholder:text-figma-text-tertiary text-sm h-auto"
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
              className="w-full sm:w-56 mx-auto py-4 bg-figma-accent hover:bg-figma-accent/90 rounded-full text-figma-text-primary text-base font-medium h-auto"
            >
              {(isLoggingIn || loading) ? 'Loading...' : method === 'magic' ? 'Send Magic Link' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="pt-6 border-t border-figma-input-border/60">
            <p className="text-center text-figma-text-tertiary text-sm">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-figma-accent hover:text-figma-accent/90 font-medium transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
