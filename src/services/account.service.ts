import api from './api'

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

const basePath = '/account'

export const accountService = {
  changePassword: async (postBody: ChangePasswordDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/change-password`
    return api.put(url, postBody)
  },
  deleteAccount: async (): Promise<BaseVo<void>> => {
    return api.delete(basePath)
  }
}
