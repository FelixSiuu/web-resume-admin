import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/services/api'
import ForgotPassword from './page'

type RouteResult = {
  status: number
  data: unknown
}

const captchaBody = {
  isSuccess: true as const,
  code: 'OK' as const,
  message: 'captcha',
  data: '/captcha.png'
}

const installAdapter = (forgotPassword: (config: InternalAxiosRequestConfig) => RouteResult) => {
  httpClient.defaults.adapter = async (config) => {
    const url = String(config.url)
    const route = url.includes('/auth/captcha') ? { status: 200, data: captchaBody } : forgotPassword(config)
    const response = {
      data: route.data,
      status: route.status,
      statusText: 'OK',
      headers: {},
      config
    } as AxiosResponse

    if (route.status >= 200 && route.status < 300) return response

    throw new AxiosError(
      `Request failed with status code ${route.status}`,
      route.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
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

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return render(<ForgotPassword />, { wrapper })
}

describe('Forgot password BaseVo over HTTP', () => {
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
  })

  afterEach(async () => {
    httpClient.defaults.adapter = originalAdapter
    restoreReplace?.()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  const submit = async (captcha = 'abcd') => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByPlaceholderText('Email'), 'user@example.com')
    await user.type(screen.getByPlaceholderText('Captcha'), captcha)
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
  }

  it('uses data.cd from an HTTP 200 CoolDownVo', async () => {
    installAdapter((config) => {
      expect(config.skipAuthRefresh).toBe(true)
      return {
        status: 200,
        data: {
          isSuccess: true,
          code: 'OK',
          message: 'We sent a reset link to your inbox.',
          data: { cd: 30 }
        }
      }
    })

    await submit()

    expect(await screen.findByText('We sent a reset link to your inbox.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend in 30s' })).toBeDisabled()
    expect(replace).not.toHaveBeenCalled()
  })

  it('uses data.cd from an HTTP 4xx CoolDownVo and stays on the page', async () => {
    installAdapter(() => ({
      status: 400,
      data: {
        isSuccess: false,
        code: 'RATE_LIMIT',
        message: 'Please wait before requesting another link.',
        data: { cd: 45 }
      }
    }))

    await submit()

    expect(await screen.findByText('Please wait before requesting another link.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend in 45s' })).toBeDisabled()
    expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com')
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('shows a 4xx captcha BaseVo.message and does not start a countdown when data is null', async () => {
    installAdapter(() => ({
      status: 400,
      data: {
        isSuccess: false,
        code: 'CAPTCHA_INVALID',
        message: 'Captcha is incorrect',
        data: null
      }
    }))

    await submit()

    expect(await screen.findByText('Captcha is incorrect')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /resend in/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it('redirects to /login on 401 and does not apply cooldown data', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    installAdapter(() => ({
      status: 401,
      data: {
        isSuccess: false,
        code: 'UNAUTHORIZED',
        message: 'Session expired',
        data: { cd: 10 }
      }
    }))

    await submit()

    expect(await screen.findByText('Request failed with status code 401')).toBeInTheDocument()
    expect(screen.queryByText('Session expired')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resend in/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
    expect(replace).toHaveBeenCalledWith('/login')
    vi.restoreAllMocks()
  })
})
