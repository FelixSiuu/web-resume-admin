import api from './api'

export interface LoginDto {
  username: string
  password: string
  captcha: string
  rememberMe: boolean
}

export interface RegisterDto {
  username: string
  password: string
}

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

const basePath = '/auth'

export const userService = {
  login: async (postBody: LoginDto): Promise<BaseVo<LoginVo>> => {
    const url = `${basePath}/login`
    return api.post(url, postBody)
  },
  register: async (postBody: RegisterDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/register`
    return api.post(url, postBody)
  },
  getCaptcha: async (): Promise<BaseVo<string>> => {
    const url = `${basePath}/captcha`
    return api.get(url)
  },
  logout: async (): Promise<BaseVo<void>> => {
    const url = `${basePath}/logout`
    return api.post(url)
  },
  refresh: async (): Promise<BaseVo<LoginVo>> => {
    const url = `${basePath}/refresh`
    return api.post(url)
  },
  changePassword: async (postBody: ChangePasswordDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/change-password`
    return api.post(url, postBody)
  },
  deleteAccount: async (): Promise<BaseVo<void>> => {
    const url = `${basePath}/account`
    return api.delete(url)
  }
}
