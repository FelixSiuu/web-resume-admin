import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeleteAccountMutation, useRequestDeleteTokenMutation } from './useAccountHooks'

const { deleteAccountMock, requestDeleteTokenMock, handleUnauthorizedMock } = vi.hoisted(() => ({
  deleteAccountMock: vi.fn(),
  requestDeleteTokenMock: vi.fn(),
  handleUnauthorizedMock: vi.fn()
}))

vi.mock('@/services/account.service', () => ({
  accountService: {
    deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
    requestDeleteToken: (...args: unknown[]) => requestDeleteTokenMock(...args)
  }
}))

vi.mock('@/services/api', () => ({
  handleUnauthorized: (...args: unknown[]) => handleUnauthorizedMock(...args)
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

describe('delete account hooks', () => {
  beforeEach(() => {
    deleteAccountMock.mockReset()
    requestDeleteTokenMock.mockReset()
    handleUnauthorizedMock.mockReset()
  })

  it('returns the delete-token BaseVo, including data.cd and data null', async () => {
    const success = {
      isSuccess: true as const,
      code: 'OK' as const,
      message: "We've sent a verification code to your email. Please check your inbox.",
      data: { cd: 45 }
    }
    requestDeleteTokenMock.mockResolvedValueOnce(success)

    const { result } = renderHook(() => useRequestDeleteTokenMutation(), { wrapper: createWrapper() })

    await expect(result.current.requestDeleteToken()).resolves.toEqual(success)

    const unverified = {
      isSuccess: false as const,
      code: 'EMAIL_UNVERIFIED',
      message: 'Please verify your email first.',
      data: null
    }
    requestDeleteTokenMock.mockResolvedValueOnce(unverified)

    await expect(result.current.requestDeleteToken()).resolves.toEqual(unverified)
    expect(handleUnauthorizedMock).not.toHaveBeenCalled()
  })

  it('signs out after a successful delete and throws the API message when delete fails', async () => {
    deleteAccountMock.mockResolvedValueOnce({ isSuccess: true, code: 'OK', message: 'deleted', data: null })

    const { result } = renderHook(() => useDeleteAccountMutation(), { wrapper: createWrapper() })

    await expect(result.current.deleteAccount({ code: 'AbC123' })).resolves.toBeUndefined()
    expect(deleteAccountMock).toHaveBeenCalledWith({ code: 'AbC123' })
    expect(handleUnauthorizedMock).toHaveBeenCalledTimes(1)

    deleteAccountMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'BAD_CODE',
      message: 'Verification code is incorrect',
      data: null
    })

    await expect(result.current.deleteAccount({ code: 'AbC123' })).rejects.toThrow('Verification code is incorrect')
    expect(handleUnauthorizedMock).toHaveBeenCalledTimes(1)
  })
})
