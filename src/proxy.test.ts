import { describe, expect, it } from 'vitest'
import type { NextRequest } from 'next/server'
import { proxy } from './proxy'

const createRequest = (pathname: string): NextRequest =>
  ({
    url: `http://localhost:3000${pathname}`,
    nextUrl: { pathname }
  }) as unknown as NextRequest

describe('proxy', () => {
  it('redirects "/" to "/overview/aboutme"', () => {
    const response = proxy(createRequest('/'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/overview/aboutme')
  })

  it('redirects "/overview" to "/overview/aboutme"', () => {
    const response = proxy(createRequest('/overview'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/overview/aboutme')
  })

  it('allows "/overview/aboutme" without cookie checks', () => {
    const response = proxy(createRequest('/overview/aboutme'))
    expect(response.status).toBe(200)
  })

  it('allows "/login" without cookie checks', () => {
    const response = proxy(createRequest('/login'))
    expect(response.status).toBe(200)
  })
})
