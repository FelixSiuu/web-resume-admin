import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api, { httpClient } from './api'
import { userService } from './user.service'
import { useAuthStore } from '@/stores/auth.store'

type RouteResult = {
  status: number
  data: unknown
}

const ok = <T>(message: string, data: T, code = 'OK'): BaseVo<T> => ({
  isSuccess: true,
  code: code as 'OK',
  message,
  data
})

const fail = <T>(message: string, data: T | null, code: string): BaseVo<T> => ({
  isSuccess: false,
  code,
  message,
  data
})

const installAdapter = (handler: (config: InternalAxiosRequestConfig) => RouteResult) => {
  httpClient.defaults.adapter = async (config) => {
    const { status, data } = handler(config)
    const response = {
      data,
      status,
      statusText: 'OK',
      headers: {},
      config
    } as AxiosResponse

    if (status >= 200 && status < 300) return response

    throw new AxiosError(
      `Request failed with status code ${status}`,
      status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response
    )
  }
}

const locationImpl = () => {
  const implSymbol = Object.getOwnPropertySymbols(window.location).find((symbol) => symbol.description === 'impl')
  if (!implSymbol) throw new Error('jsdom location impl is missing')
  return (window.location as unknown as Record<symbol, { replace: (url: string) => void }>)[implSymbol]
}

describe('API BaseVo contract', () => {
  const replace = vi.fn()
  let restoreReplace: (() => void) | undefined
  let originalAdapter: typeof httpClient.defaults.adapter

  beforeEach(() => {
    originalAdapter = httpClient.defaults.adapter
    replace.mockReset()
    window.history.pushState({}, '', '/forgot-password')
    const impl = locationImpl()
    const originalReplace = impl.replace
    impl.replace = replace
    restoreReplace = () => {
      impl.replace = originalReplace
    }
    useAuthStore.setState({ user: null, xsrfToken: null })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    httpClient.defaults.adapter = originalAdapter
    restoreReplace?.()
    vi.restoreAllMocks()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it('returns the 2xx BaseVo, including forgot-password data.cd, without redirecting', async () => {
    const body = ok('We sent a reset link to your inbox.', { cd: 45 })
    installAdapter((config) => {
      expect(config.url).toContain('/auth/forgot-password')
      expect(config.skipAuthRefresh).toBe(true)
      return { status: 200, data: body }
    })

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).resolves.toEqual(body)
    expect(replace).not.toHaveBeenCalled()
  })

  it('returns a 2xx captcha failure BaseVo when data is null and does not invent a cooldown', async () => {
    const body = fail('Captcha is incorrect', null, 'CAPTCHA_INVALID')
    installAdapter(() => ({ status: 200, data: body }))

    const result = await userService.forgotPassword({ email: 'user@example.com', captcha: 'bad' })

    expect(result).toEqual(body)
    expect(result.data).toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it('reads CoolDownVo from a forgot-password 4xx body and does not redirect', async () => {
    const body = fail('Please wait before requesting another link.', { cd: 30 }, 'RATE_LIMIT')
    installAdapter((config) => {
      expect(config.skipAuthRefresh).toBe(true)
      return { status: 400, data: body }
    })

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).resolves.toEqual(body)
    expect(replace).not.toHaveBeenCalled()
  })

  it('reads a captcha BaseVo from a forgot-password 4xx body when data is null', async () => {
    const body = fail('Captcha is incorrect', null, 'CAPTCHA_INVALID')
    installAdapter(() => ({ status: 400, data: body }))

    const result = await userService.forgotPassword({ email: 'user@example.com', captcha: 'bad' })

    expect(result).toEqual(body)
    expect(result.data).toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it('reads a 4xx BaseVo for validate-reset-token without redirecting', async () => {
    const body = fail('Reset link is invalid or has expired.', null, 'TOKEN_EXPIRED')
    installAdapter((config) => {
      expect(config.url).toContain('/auth/validate-reset-token')
      expect(config.skipAuthRefresh).toBe(true)
      return { status: 400, data: body }
    })

    await expect(userService.validateResetToken({ token: 'expired-token' })).resolves.toEqual(body)
    expect(replace).not.toHaveBeenCalled()
  })

  it('reads a 4xx BaseVo for reset-password without redirecting', async () => {
    const body = fail('Reset link is invalid or has expired.', null, 'TOKEN_EXPIRED')
    installAdapter((config) => {
      expect(config.url).toContain('/auth/reset-password')
      expect(config.skipAuthRefresh).toBe(true)
      return { status: 422, data: body }
    })

    await expect(userService.resetPassword({ token: 'expired-token', password: 'abc12345' })).resolves.toEqual(body)
    expect(replace).not.toHaveBeenCalled()
  })

  it('reads a 4xx BaseVo from non-auth endpoints', async () => {
    const body = fail('Paragraph is required', null, 'VALIDATION')
    installAdapter((config) => {
      expect(config.url).toContain('/myInfo/about')
      return { status: 400, data: body }
    })

    await expect(api.post('/myInfo/about', { paragraph: '' })).resolves.toEqual(body)
    expect(replace).not.toHaveBeenCalled()
  })

  it('rejects a 4xx response that is not BaseVo and does not redirect', async () => {
    installAdapter(() => ({ status: 400, data: '<html>bad request</html>' }))

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).rejects.toSatisfy(
      (error: unknown) => axios.isAxiosError(error) && error.response?.status === 400
    )
    expect(replace).not.toHaveBeenCalled()
  })

  it('rejects HTTP 500 even when the body looks like BaseVo, and does not redirect', async () => {
    installAdapter(() => ({
      status: 500,
      data: fail('Server exploded', null, 'INTERNAL')
    }))

    await expect(api.get('/myInfo/about')).rejects.toSatisfy(
      (error: unknown) => axios.isAxiosError(error) && error.response?.status === 500
    )
    expect(replace).not.toHaveBeenCalled()
  })

  it('redirects to /login and keeps rejecting when forgot-password returns 401', async () => {
    const body = fail('Session expired', { cd: 10 }, 'UNAUTHORIZED')
    installAdapter(() => ({ status: 401, data: body }))

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).rejects.toMatchObject({
      response: { status: 401, data: body }
    })
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('redirects to /login and keeps rejecting when forgot-password returns 403', async () => {
    const body = fail('Forbidden', null, 'FORBIDDEN')
    installAdapter(() => ({ status: 403, data: body }))

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).rejects.toMatchObject({
      response: { status: 403, data: body }
    })
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('does not call location.replace when a 401 happens on /login', async () => {
    window.history.pushState({}, '', '/login')
    installAdapter((config) => {
      expect(String(config.url)).not.toContain('/auth/refresh')
      return { status: 401, data: fail('Invalid credentials', null, 'UNAUTHORIZED') }
    })

    await expect(
      userService.login({ username: 'felix', password: 'secret', captcha: 'abcd', rememberMe: true })
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(replace).not.toHaveBeenCalled()
  })

  it('refreshes once on a business 401 and retries the original request', async () => {
    const calls: string[] = []
    installAdapter((config) => {
      const url = String(config.url)
      calls.push(url)
      if (url.includes('/auth/refresh')) {
        expect(config.skipAuthRefresh).toBe(true)
        return {
          status: 200,
          data: ok('refreshed', { username: 'felix', xsrfToken: 'xsrf-next' })
        }
      }
      if (url.includes('/myInfo/about') && !config._retry) {
        return { status: 401, data: fail('expired', null, 'UNAUTHORIZED') }
      }
      return { status: 200, data: ok('loaded', [{ id: 1 }]) }
    })

    await expect(api.get('/myInfo/about')).resolves.toEqual(ok('loaded', [{ id: 1 }]))
    expect(calls.filter((url) => url.includes('/auth/refresh'))).toHaveLength(1)
    expect(calls.filter((url) => url.includes('/myInfo/about'))).toHaveLength(2)
    expect(useAuthStore.getState().xsrfToken).toBe('xsrf-next')
    expect(useAuthStore.getState().user).toEqual({ username: 'felix' })
    expect(replace).not.toHaveBeenCalled()
  })

  it('redirects to /login when the refresh request returns 401', async () => {
    const calls: string[] = []
    installAdapter((config) => {
      const url = String(config.url)
      calls.push(url)
      if (url.includes('/auth/refresh')) {
        return { status: 401, data: fail('refresh expired', null, 'UNAUTHORIZED') }
      }
      return { status: 401, data: fail('expired', null, 'UNAUTHORIZED') }
    })

    await expect(api.get('/myInfo/about')).rejects.toMatchObject({ response: { status: 401 } })
    expect(calls.filter((url) => url.includes('/auth/refresh'))).toHaveLength(1)
    expect(replace).toHaveBeenCalledWith('/login')
  })

  it('redirects to /login when a business request returns 403', async () => {
    installAdapter(() => ({ status: 403, data: fail('nope', null, 'FORBIDDEN') }))

    await expect(api.get('/myInfo/about')).rejects.toMatchObject({ response: { status: 403 } })
    expect(replace).toHaveBeenCalledWith('/login')
  })
})
