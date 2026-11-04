import { afterEach, describe, expect, it } from 'vitest'
import { getCookie } from './cookie'

describe('getCookie', () => {
  afterEach(() => {
    document.cookie.split('; ').forEach((part) => {
      const name = part.split('=')[0]
      if (name) {
        document.cookie = `${name}=; Max-Age=0; Path=/`
      }
    })
  })

  it('returns undefined when cookie is missing', () => {
    expect(getCookie('XSRF_TOKEN')).toBeUndefined()
  })

  it('reads XSRF_TOKEN cookie value', () => {
    document.cookie = 'XSRF_TOKEN=csrf-test-value; Path=/'
    expect(getCookie('XSRF_TOKEN')).toBe('csrf-test-value')
  })
})
