import { createRouteClient } from '@/supabase/utils/route'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin

  // Create a mutable response so exchangeCodeForSession can write auth cookies
  // into it. We will mutate the redirect target after we know where to send the user.
  const response = NextResponse.redirect(`${baseUrl}/login?error=auth_failed`)

  const supabase = await createRouteClient(response)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return response
  }

  // Check whether a profile already exists for this user
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', data.user.id)
    .single()

  // First-time sign-in via magic link or OAuth: create a minimal profile row.
  // name and role are NOT NULL in the schema so we provide placeholder values
  // that onboarding will replace.
  if (profileError && profileError.code === 'PGRST116') {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        name: '',
        role: 'Builder',
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Profile creation failed in callback:', insertError)
    }
  }

  // Returning users go to /main; new (or incomplete) users go to /onboarding.
  const redirectPath = profile?.onboarding_complete ? '/main' : '/onboarding'

  // Mutate the redirect URL on the SAME response object so that the auth
  // cookies written by exchangeCodeForSession are preserved.
  response.headers.set('Location', `${baseUrl}${redirectPath}`)

  return response
}
