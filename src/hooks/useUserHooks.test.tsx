import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useForgotPasswordMutation, useResetPasswordMutation, useValidateResetTokenMutation } from './useUserHooks'

const { forgotPasswordMock, resetPasswordMock, validateResetTokenMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  validateResetTokenMock: vi.fn()
}))

vi.mock('@/services/user.service', () => ({
  userService: {
    forgotPassword: forgotPasswordMock,
    resetPassword: resetPasswordMock,
    validateResetToken: validateResetTokenMock
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
    validateResetTokenMock.mockReset()
  })

  it('returns the success BaseVo including data.cd', async () => {
    const body = {
      isSuccess: true as const,
      code: 'OK' as const,
      message: 'We sent a reset link to your inbox.',
      data: { cd: 45 }
    }
    forgotPasswordMock.mockResolvedValueOnce(body)

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).resolves.toEqual(body)
  })

  it('returns the failure BaseVo including data.cd', async () => {
    const body = {
      isSuccess: false as const,
      code: 'RATE_LIMIT',
      message: 'Please wait before requesting another link.',
      data: { cd: 30 }
    }
    forgotPasswordMock.mockResolvedValueOnce(body)

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'bad' })).resolves.toEqual(body)
  })

  it('returns a failure BaseVo when data is null', async () => {
    const body = {
      isSuccess: false as const,
      code: 'CAPTCHA_INVALID',
      message: 'Captcha is incorrect',
      data: null
    }
    forgotPasswordMock.mockResolvedValueOnce(body)

    const { result } = renderHook(() => useForgotPasswordMutation(), { wrapper: createWrapper() })

    await expect(result.current.forgotPassword({ email: 'user@example.com', captcha: 'bad' })).resolves.toEqual(body)
  })

  it('returns BaseVo.message when the reset token is valid', async () => {
    validateResetTokenMock.mockResolvedValueOnce({
      isSuccess: true,
      code: 'OK',
      message: 'Reset link is valid.',
      data: null
    })

    const { result } = renderHook(() => useValidateResetTokenMutation(), { wrapper: createWrapper() })

    await expect(result.current.validateResetToken({ token: 'reset-token' })).resolves.toBe('Reset link is valid.')
  })

  it('throws BaseVo.message when the reset token is invalid', async () => {
    validateResetTokenMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'TOKEN_EXPIRED',
      message: 'Reset link is invalid or has expired.',
      data: null
    })

    const { result } = renderHook(() => useValidateResetTokenMutation(), { wrapper: createWrapper() })

    await expect(result.current.validateResetToken({ token: 'expired-token' })).rejects.toThrow(
      'Reset link is invalid or has expired.'
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
