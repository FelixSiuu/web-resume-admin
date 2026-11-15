import api from './api'

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

export interface EmailDto {
  email: string
}

export interface EmailVo {
  email: string
  verified: boolean
  nextStepMessage?: string
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
  getEmail: async (): Promise<BaseVo<EmailVo>> => {
    const url = `${basePath}/email`
    return api.get(url)
  },
  updateEmail: async (postBody: EmailDto): Promise<BaseVo<EmailVo>> => {
    const url = `${basePath}/update-email`
    return api.put(url, postBody)
  }
}
