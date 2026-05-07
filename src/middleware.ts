import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Update session, this will also call `supabase.auth.getUser()`
    const supabaseResponse = await updateSession(request)
    return supabaseResponse
  } catch (error) {
    console.error('Middleware error:', error)
    // Return a basic response on error
    return NextResponse.next()
  }
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
