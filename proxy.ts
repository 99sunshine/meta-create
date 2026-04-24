import { type NextRequest } from 'next/server'
import { createClient } from '@/supabase/utils/middleware'

export default async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  // getUser() both validates the JWT and refreshes the session token when
  // it is close to expiry. This must be called on every request so that
  // cookies stay up to date and users remain logged in across page reloads.
  await supabase.auth.getUser()

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
    // 排除 /api/analytics：埋点无需每次走 Supabase getUser()，减轻注册后连发请求时的 proxy 延迟
    '/((?!_next/static|_next/image|favicon.ico|api/analytics|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
