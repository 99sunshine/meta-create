import { createRouteClient } from '@/supabase/utils/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    const redirectUrl = isLocalEnv 
      ? `${origin}${next}` 
      : forwardedHost 
        ? `https://${forwardedHost}${next}` 
        : `${origin}${next}`
    
    const response = NextResponse.redirect(redirectUrl)
    const supabase = await createRouteClient(response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
