import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accountService } from './account.service'

const { getMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  deleteMock: vi.fn()
}))

vi.mock('./api', () => ({
  default: {
    get: getMock,
    delete: deleteMock
  }
}))

describe('accountService delete-account endpoints', () => {
  beforeEach(() => {
    getMock.mockReset()
    deleteMock.mockReset()
  })

  it('gets /auth/delete-token with no body', async () => {
    const response = { isSuccess: true, code: 'OK', message: 'sent', data: { cd: 30 } }
    getMock.mockResolvedValueOnce(response)

    const result = await accountService.requestDeleteToken()

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('/auth/delete-token')
    expect(result).toEqual(response)
  })

  it('returns a delete-token failure body, including data null', async () => {
    const response = { isSuccess: false, code: 'EMAIL_UNVERIFIED', message: 'Verify your email', data: null }
    getMock.mockResolvedValueOnce(response)

    await expect(accountService.requestDeleteToken()).resolves.toEqual(response)
  })

  it('deletes /account with the verification code in the JSON body', async () => {
    const response = { isSuccess: true, code: 'OK', message: 'deleted', data: null }
    deleteMock.mockResolvedValueOnce(response)

    const result = await accountService.deleteAccount({ code: 'AbC123' })

    expect(deleteMock).toHaveBeenCalledWith('/account', { data: { code: 'AbC123' } })
    expect(result).toEqual(response)
  })
})
