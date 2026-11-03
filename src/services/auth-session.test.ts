import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setMock, removeMock, clearUserMock } = vi.hoisted(() => ({
  setMock: vi.fn(),
  removeMock: vi.fn(),
  clearUserMock: vi.fn()
}))

vi.mock('js-cookie', () => ({
  default: {
    set: setMock,
    remove: removeMock
  }
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: () => ({
      clearUser: clearUserMock
    })
  }
}))

import { clearAuthSession, setAuthToken } from './auth-session'

describe('setAuthToken', () => {
  beforeEach(() => {
    setMock.mockClear()
  })

  it('sets a 1-day cookie when rememberMe is true', () => {
    setAuthToken('mock-token', { rememberMe: true })

    expect(setMock).toHaveBeenCalledWith('token', 'mock-token', {
      expires: 1,
      sameSite: 'Lax',
      secure: false,
      path: '/'
    })
  })

  it('sets a session cookie when rememberMe is false', () => {
    setAuthToken('mock-token', { rememberMe: false })

    expect(setMock).toHaveBeenCalledWith('token', 'mock-token', {
      sameSite: 'Lax',
      secure: false,
      path: '/'
    })
  })
})

describe('clearAuthSession', () => {
  beforeEach(() => {
    removeMock.mockClear()
    clearUserMock.mockClear()
  })

  it('removes token cookie and clears auth user', () => {
    clearAuthSession()
    expect(removeMock).toHaveBeenCalledWith('token', { path: '/' })
    expect(clearUserMock).toHaveBeenCalledTimes(1)
  })
})
