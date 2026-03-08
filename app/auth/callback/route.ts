import { createRouteClient } from '@/supabase/utils/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    const baseUrl = isLocalEnv
      ? origin
      : forwardedHost
        ? `https://${forwardedHost}`
        : origin

    // Create a placeholder response to exchange the auth code and set session cookies.
    // We need a NextResponse for createRouteClient to attach cookies to.
    const placeholderResponse = NextResponse.redirect(`${baseUrl}/`)
    const supabase = await createRouteClient(placeholderResponse)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine where to send the user
      let destination = next
      if (!destination) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single()

          destination = profile?.onboarding_complete ? '/' : '/onboarding'
        } else {
          destination = '/onboarding'
        }
      }

      // Build the final redirect, carrying over auth cookies from the code exchange
      const response = NextResponse.redirect(`${baseUrl}${destination}`)
      placeholderResponse.cookies.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value)
      })
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
