import { createRouteClient } from '@/supabase/utils/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    const response = NextResponse.redirect(
      isLocalEnv 
        ? `${origin}${next}` 
        : forwardedHost 
          ? `https://${forwardedHost}${next}` 
          : `${origin}${next}`
    )
    
    const supabase = await createRouteClient(response)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single()
      
      const redirectPath = profile?.onboarding_complete ? '/' : '/onboarding'
      
      return NextResponse.redirect(
        isLocalEnv 
          ? `${origin}${redirectPath}` 
          : forwardedHost 
            ? `https://${forwardedHost}${redirectPath}` 
            : `${origin}${redirectPath}`
      )
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
