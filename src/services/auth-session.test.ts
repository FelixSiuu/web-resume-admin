import { beforeEach, describe, expect, it, vi } from 'vitest'

const { removeMock, clearUserMock } = vi.hoisted(() => ({
  removeMock: vi.fn(),
  clearUserMock: vi.fn()
}))

vi.mock('js-cookie', () => ({
  default: {
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

import { clearAuthSession } from './auth-session'

describe('clearAuthSession', () => {
  beforeEach(() => {
    removeMock.mockClear()
    clearUserMock.mockClear()
  })

  it('removes token cookie and clears auth user', () => {
    clearAuthSession()
    expect(removeMock).toHaveBeenCalledWith('token')
    expect(clearUserMock).toHaveBeenCalledTimes(1)
  })
})
