import api from './api'

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

export interface BindEmailDto {
  email: string
}

export interface BoundEmailVo {
  email: string
  verified: boolean
}

const basePath = '/account'

export const accountService = {
  changePassword: async (postBody: ChangePasswordDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/change-password`
    return api.put(url, postBody)
  },
  deleteAccount: async (): Promise<BaseVo<void>> => {
    return api.delete(basePath)
  },
  // TODO: replace stub with real POST /account/bind-email when backend is ready
  bindEmail: async (postBody: BindEmailDto): Promise<BaseVo<BoundEmailVo>> => {
    return {
      isSuccess: true,
      code: 'OK',
      message: 'OK',
      data: {
        email: postBody.email,
        verified: false
      }
    }
  }
}
