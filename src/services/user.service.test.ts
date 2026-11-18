import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userService } from './user.service'

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn()
}))

vi.mock('./api', () => ({
  default: {
    post: postMock
  }
}))

describe('userService password reset endpoints', () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  it('posts /auth/forgot-password with email and captcha', async () => {
    const response = { isSuccess: true, code: 'OK', message: 'sent', data: { cd: 60 } }
    postMock.mockResolvedValueOnce(response)

    const result = await userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })

    expect(postMock).toHaveBeenCalledWith(
      '/auth/forgot-password',
      { email: 'user@example.com', captcha: 'abcd' },
      { skipAuthRefresh: true }
    )
    expect(result).toEqual(response)
  })

  it('propagates an unexpected forgot-password failure', async () => {
    const networkError = new Error('Network Error')
    postMock.mockRejectedValueOnce(networkError)

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).rejects.toBe(networkError)
  })

  it('posts /auth/validate-reset-token with the token', async () => {
    const response = { isSuccess: true, code: 'OK', message: 'Reset link is valid.', data: null }
    postMock.mockResolvedValueOnce(response)

    const result = await userService.validateResetToken({ token: 'reset-token' })

    expect(postMock).toHaveBeenCalledWith('/auth/validate-reset-token', { token: 'reset-token' }, { skipAuthRefresh: true })
    expect(result).toEqual(response)
  })

  it('posts /auth/reset-password with token and password', async () => {
    const response = { isSuccess: true, code: 'OK', message: 'updated', data: null }
    postMock.mockResolvedValueOnce(response)

    await userService.resetPassword({ token: 'reset-token', password: 'abc12345' })

    expect(postMock).toHaveBeenCalledWith(
      '/auth/reset-password',
      { token: 'reset-token', password: 'abc12345' },
      { skipAuthRefresh: true }
    )
  })
})
