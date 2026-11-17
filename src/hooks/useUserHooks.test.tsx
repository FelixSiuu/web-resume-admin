import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useForgotPasswordMutation, useResetPasswordMutation } from './useUserHooks'

const { forgotPasswordMock, resetPasswordMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
  resetPasswordMock: vi.fn()
}))

vi.mock('@/services/user.service', () => ({
  userService: {
    forgotPassword: forgotPasswordMock,
    resetPassword: resetPasswordMock
  }
}))

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

  it('returns BaseVo.message when forgot-password succeeds', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      isSuccess: true,
      code: 'OK',
      message: 'We sent a reset link to your inbox.',
      data: null
    })

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).resolves.toBe(
      'We sent a reset link to your inbox.'
    )
  })

  it('throws BaseVo.message when forgot-password fails', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'CAPTCHA_INVALID',
      message: 'Captcha is incorrect',
      data: null
    })

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'bad' })).rejects.toThrow(
      'Captcha is incorrect'
    )
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
