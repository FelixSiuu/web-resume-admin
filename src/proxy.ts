import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Route-only redirects. Auth is enforced by the API (HttpOnly ACCESS_TOKEN on the
 * API origin); Axios 401 handler clears client state and sends the user to /login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/' || pathname === '/overview') {
    return NextResponse.redirect(new URL('/overview/aboutme', request.url))
  }

  return NextResponse.next()
}
