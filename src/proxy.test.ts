import { describe, expect, it } from 'vitest'
import type { NextRequest } from 'next/server'
import { proxy } from './proxy'

const createRequest = (pathname: string, token?: string): NextRequest =>
  ({
    url: `http://localhost:3000${pathname}`,
    nextUrl: { pathname },
    cookies: {
      get: (key: string) => {
        if (key !== 'token' || !token) return undefined
        return { name: 'token', value: token }
      }
    }
  }) as unknown as NextRequest

describe('proxy', () => {
  it('redirects "/" to "/overview"', () => {
    const response = proxy(createRequest('/'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/overview')
  })

  it('redirects unauthenticated "/overview" to "/login"', () => {
    const response = proxy(createRequest('/overview/aboutme'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/login')
  })

  it('allows authenticated "/overview" request', () => {
    const response = proxy(createRequest('/overview/aboutme', 'token-value'))
    expect(response.status).toBe(200)
  })
})
