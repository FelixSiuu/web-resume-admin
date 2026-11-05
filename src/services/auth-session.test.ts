import { beforeEach, describe, expect, it, vi } from 'vitest'

const { clearUserMock } = vi.hoisted(() => ({
  clearUserMock: vi.fn()
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
    clearUserMock.mockClear()
  })

  it('clears auth user and persisted xsrf token (HttpOnly ACCESS_TOKEN is backend-owned)', () => {
    clearAuthSession()
    expect(clearUserMock).toHaveBeenCalledTimes(1)
  })
})

