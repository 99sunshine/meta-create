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
      <div className="min-h-screen flex items-center justify-center bg-[#121B3E] p-4 relative overflow-hidden">
        {/* Radial gradient blob */}
        <div 
          className="absolute pointer-events-none"
          style={{
            width: 442,
            height: 442,
            left: -23,
            top: 195,
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(193, 126, 69, 0.65) 0%, rgba(105.50, 76.50, 65.50, 0.82) 50%, #3E3440 70%, rgba(39.87, 39.37, 62.87, 0.96) 84%, #121B3E 100%)',
            boxShadow: '6.35px 6.35px 6.35px',
            borderRadius: 9999,
            filter: 'blur(3.18px)',
          }}
        />

        <div className="w-full max-w-[381px] flex flex-col items-center gap-5 relative z-10">
          <div className="w-20 h-20 bg-[rgba(231,119,15,0.2)] rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📧</span>
          </div>
          <h1 className="text-white text-2xl font-bold text-center">Check your email!</h1>
          <p className="text-[#E6E6E6] text-center text-base">
            We sent a magic link to <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-sm text-[#BFBFBF] text-center">
            Click the link in the email to sign in. You can close this tab.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="w-[233px] py-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[25px] text-white hover:bg-[rgba(255,255,255,0.15)] transition-all"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121B3E] p-4 relative overflow-hidden">
      {/* Radial gradient blob */}
      <div 
        className="absolute pointer-events-none"
        style={{
          width: 442,
          height: 442,
          left: -23,
          top: 195,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(193, 126, 69, 0.65) 0%, rgba(105.50, 76.50, 65.50, 0.82) 50%, #3E3440 70%, rgba(39.87, 39.37, 62.87, 0.96) 84%, #121B3E 100%)',
          boxShadow: '6.35px 6.35px 6.35px',
          borderRadius: 9999,
          filter: 'blur(3.18px)',
        }}
      />

      <div className="w-full max-w-[381px] flex flex-col items-center gap-8 relative z-10">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-2">
            Welcome Back 👋
          </h1>
          <p className="text-[#E6E6E6] text-lg">
            Sign in to MetaCreate
          </p>
        </div>

        <div className="w-full max-w-[330px] flex flex-col gap-6">
          {/* Method Toggle */}
          <div className="flex gap-2 p-1 bg-[rgba(255,255,255,0.10)] rounded-lg">
            <button
              onClick={() => setMethod('password')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'password'
                  ? 'bg-[#E7770F] text-white'
                  : 'text-[#BFBFBF] hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                method === 'magic'
                  ? 'bg-[#E7770F] text-white'
                  : 'text-[#BFBFBF] hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Form */}
          <form onSubmit={method === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-white text-sm leading-[14px]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-[15px] px-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[10px] text-white placeholder:text-[#BFBFBF] text-sm h-auto"
              />
            </div>

            {method === 'password' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-white text-sm leading-[14px]">
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
                  className="w-full py-[15px] px-[15px] bg-[rgba(255,255,255,0.10)] border border-[rgba(103.45,121.38,157.25,0.50)] rounded-[10px] text-white placeholder:text-[#BFBFBF] text-sm h-auto"
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
              className="w-[233px] mx-auto py-[15px] bg-[#E7770F] hover:bg-[#d66d0d] rounded-[25px] text-white text-base font-medium h-auto"
            >
              {(isLoggingIn || loading) ? 'Loading...' : method === 'magic' ? 'Send Magic Link' : 'Sign In'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="pt-6 border-t border-[rgba(103.45,121.38,157.25,0.30)]">
            <p className="text-center text-[#BFBFBF] text-sm">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-[#E7770F] hover:text-[#d66d0d] font-medium transition-colors"
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
