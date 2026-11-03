import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyHeader from './myHeader'

const pushMock = vi.fn()
const clearAuthSessionMock = vi.fn()
const logoutMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}))

vi.mock('@/services/auth-session', () => ({
  clearAuthSession: () => clearAuthSessionMock()
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: { username: 'felix' }
  })
}))

vi.mock('@/services/user.service', () => ({
  userService: {
    logout: (...args: unknown[]) => logoutMock(...args)
  }
}))

describe('MyHeader', () => {
  beforeEach(() => {
    pushMock.mockClear()
    clearAuthSessionMock.mockClear()
    logoutMock.mockClear()
  })

  it('shows current username', () => {
    render(<MyHeader />)
    expect(screen.getByText('Hi, felix')).toBeInTheDocument()
  })

  it('calls logout API then clears session and navigates to login', async () => {
    logoutMock.mockResolvedValueOnce({ isSuccess: true, code: 'OK', message: 'ok', data: null })

    const user = userEvent.setup()
    render(<MyHeader />)
    await user.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1)
      expect(clearAuthSessionMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/login')
    })
  })

  it('still clears session and navigates when logout API fails', async () => {
    logoutMock.mockRejectedValueOnce(new Error('logout failed'))

    const user = userEvent.setup()
    render(<MyHeader />)
    await user.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1)
      expect(clearAuthSessionMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/login')
    })
  })
})
