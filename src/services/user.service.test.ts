import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userService } from './user.service'

const axiosResponse = (data: unknown, status: number): AxiosResponse =>
  ({
    data,
    status,
    statusText: '',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig
  }) as AxiosResponse

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

  it('keeps message and cd from an HTTP error body', async () => {
    postMock.mockRejectedValueOnce(
      new axios.AxiosError(
        'Request failed with status code 429',
        axios.AxiosError.ERR_BAD_REQUEST,
        undefined,
        undefined,
        axiosResponse(
          {
            isSuccess: false,
            code: 'RATE_LIMIT',
            message: 'Please wait before requesting another link.',
            data: { cd: '45' }
          },
          429
        )
      )
    )

    await expect(userService.forgotPassword({ email: 'user@example.com', captcha: 'abcd' })).resolves.toEqual({
      isSuccess: false,
      code: 'RATE_LIMIT',
      message: 'Please wait before requesting another link.',
      data: { cd: 45 }
    })
  })

  it('rethrows errors that are not a forgot-password body', async () => {
    const networkError = new axios.AxiosError('Network Error', axios.AxiosError.ERR_NETWORK)
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

  it('keeps the validate-reset-token message from an HTTP error body', async () => {
    postMock.mockRejectedValueOnce(
      new axios.AxiosError(
        'Request failed with status code 400',
        axios.AxiosError.ERR_BAD_REQUEST,
        undefined,
        undefined,
        axiosResponse(
          {
            isSuccess: false,
            code: 'TOKEN_EXPIRED',
            message: 'Reset link is invalid or has expired.',
            data: null
          },
          400
        )
      )
    )

    await expect(userService.validateResetToken({ token: 'expired-token' })).resolves.toEqual({
      isSuccess: false,
      code: 'TOKEN_EXPIRED',
      message: 'Reset link is invalid or has expired.',
      data: null
    })
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
