'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendMagicLink, signUpWithPassword, checkEmailExists } from '@/supabase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuthMethod = 'password' | 'magic'

export default function SignUpPage() {
  const router = useRouter()
  const [method, setMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showExistingEmailModal, setShowExistingEmailModal] = useState(false)

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        setShowExistingEmailModal(true)
        setLoading(false)
        return
      }

      // Continue with signup - email confirmation disabled in Supabase
      await signUpWithPassword(email, password)
      router.push('/onboarding')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        setShowExistingEmailModal(true)
        setLoading(false)
        return
      }

      // Continue with magic link
      await sendMagicLink(email)
      setEmailSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
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
              We sent a {method === 'password' ? 'confirmation' : 'magic'} link to{' '}
              <span className="text-white font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-400 text-center">
              Click the link in the email to {method === 'password' ? 'confirm your account and get started' : 'sign in and complete your profile'}.
            </p>
            <Button
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="w-full mt-4 bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50"
            >
              Back to sign up
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

      {/* Existing Email Modal */}
      {showExistingEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900/95 border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <CardTitle className="text-white text-2xl">Account Already Exists</CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                An account with <span className="text-white font-medium">{email}</span> already exists
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300 text-center">
                You already have a MetaCreate account. Please sign in instead.
              </p>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12">
                  Go to Login
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => setShowExistingEmailModal(false)}
                className="w-full bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700/50 h-12"
              >
                Try Different Email
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-white text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Join MetaCreate 🚀
          </CardTitle>
          <CardDescription className="text-slate-400 text-lg">
            Start finding your co-creators
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
          <form onSubmit={method === 'password' ? handlePasswordSignUp : handleMagicLink} className="space-y-5">
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
              <>
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-base font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 h-12 text-lg"
                  />
                  <p className="text-xs text-slate-500">Must be at least 6 characters</p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-semibold"
            >
              {loading ? 'Creating account...' : method === 'magic' ? 'Send Magic Link' : 'Create Account'}
            </Button>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
