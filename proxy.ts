import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/supabase/utils/middleware'

export default async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  // IMPORTANT: Use getClaims() instead of getSession() to refresh the auth token
  // getClaims() validates the JWT signature every time, ensuring secure session refresh
  await supabase.auth.getClaims()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
