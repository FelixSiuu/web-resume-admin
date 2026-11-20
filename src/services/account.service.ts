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

export interface DeleteAccountDto {
  code: string
}

const basePath = '/account'

export const accountService = {
  changePassword: async (postBody: ChangePasswordDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/change-password`
    return api.put(url, postBody)
  },
  deleteAccount: async (body: DeleteAccountDto): Promise<BaseVo<void>> => {
    return api.delete(basePath, { data: body })
  },
  // GET is intentional: this route sends the delete-account email and takes no body.
  requestDeleteToken: async (): Promise<BaseVo<CoolDownVo>> => {
    return api.get('/auth/delete-token')
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
