import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MyHeader from './myHeader'

const pushMock = vi.fn()
const clearAuthSessionMock = vi.fn()

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

describe('MyHeader', () => {
  beforeEach(() => {
    pushMock.mockClear()
    clearAuthSessionMock.mockClear()
  })

  it('shows current username', () => {
    render(<MyHeader />)
    expect(screen.getByText('Hi, felix')).toBeInTheDocument()
  })

  it('clears session and navigates to login on logout', async () => {
    const user = userEvent.setup()
    render(<MyHeader />)
    await user.click(screen.getByRole('button', { name: /logout/i }))
    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/login')
  })
})
