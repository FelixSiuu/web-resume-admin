import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useForgotPasswordMutation, useResetPasswordMutation } from './useUserHooks'

const { forgotPasswordMock, resetPasswordMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
  resetPasswordMock: vi.fn()
}))

vi.mock('@/services/user.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/user.service')>()
  return {
    ...actual,
    userService: {
      forgotPassword: forgotPasswordMock,
      resetPassword: resetPasswordMock
    }
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('password reset hooks', () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset()
    resetPasswordMock.mockReset()
  })

  it('returns BaseVo.message and cooldown when forgot-password succeeds', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      isSuccess: true,
      code: 'OK',
      message: 'We sent a reset link to your inbox.',
      data: { cd: 45 }
    })

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).resolves.toEqual({
      message: 'We sent a reset link to your inbox.',
      cd: 45
    })
  })

  it('throws BaseVo.message and keeps cooldown when forgot-password fails', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'RATE_LIMIT',
      message: 'Please wait before requesting another link.',
      data: { cd: '30' }
    })

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'bad' })).rejects.toMatchObject({
      message: 'Please wait before requesting another link.',
      cd: 30
    })
  })

  it('uses cooldown 0 when a failed forgot-password response has no cd', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'CAPTCHA_INVALID',
      message: 'Captcha is incorrect',
      data: null
    })

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'bad' })).rejects.toMatchObject({
      message: 'Captcha is incorrect',
      cd: 0
    })
  })

  it('returns BaseVo.message when reset-password succeeds', async () => {
    resetPasswordMock.mockResolvedValueOnce({
      isSuccess: true,
      code: 'OK',
      message: 'Your password has been updated.',
      data: null
    })

    const { result } = renderHook(() => useResetPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.resetPassword({ token: 'reset-token', password: 'abc12345' })).resolves.toBe(
      'Your password has been updated.'
    )
  })

  it('throws BaseVo.message when reset-password fails', async () => {
    resetPasswordMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'TOKEN_EXPIRED',
      message: 'Reset link is invalid or has expired.',
      data: null
    })

    const { result } = renderHook(() => useResetPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.resetPassword({ token: 'expired', password: 'abc12345' })).rejects.toThrow(
      'Reset link is invalid or has expired.'
    )
  })
})
