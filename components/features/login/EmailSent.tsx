import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EmailSentProps {
  email: string
}

export function EmailSent({ email }: EmailSentProps) {
  return (
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
      </CardContent>
    </Card>
  )
}
