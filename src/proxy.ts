import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? '/overview/aboutme' : '/login', request.url))
  }

  if (!token && pathname.startsWith('/overview')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/overview') {
    return NextResponse.redirect(new URL('/overview/aboutme', request.url))
  }

  return NextResponse.next()
}
