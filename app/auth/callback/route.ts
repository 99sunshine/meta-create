import { createRouteClient } from '@/supabase/utils/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'magiclink' | 'email' | null
  const next = searchParams.get('next') ?? '/'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const redirectBase = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  const redirectUrl = `${redirectBase}${next}`
  const response = NextResponse.redirect(redirectUrl)
  const supabase = await createRouteClient(response)

  let error = null

  if (code) {
    // PKCE flow: exchange auth code for session
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else if (token_hash && type) {
    // Token hash flow: verify OTP from magic link email
    const result = await supabase.auth.verifyOtp({ token_hash, type })
    error = result.error
  } else {
    // No auth parameters present
    return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`)
  }

  if (!error) {
    return response
  }

  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`)
}
