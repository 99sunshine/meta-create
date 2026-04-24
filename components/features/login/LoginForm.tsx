'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginFormProps {
  email: string
  setEmail: (email: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  loading: boolean
  error: string
}

export function LoginForm({ email, setEmail, onSubmit, loading, error }: LoginFormProps) {
  return (
    <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl relative z-10">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          MetaCreate 🚀
        </CardTitle>
        <CardDescription className="text-slate-400 text-lg">
          Find Your Co-Creator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
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
            {loading ? 'Sending...' : 'Continue with Email'}
          </Button>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            New user? You&apos;ll be guided through onboarding.<br />
            Returning user? You&apos;ll go straight to your dashboard.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
