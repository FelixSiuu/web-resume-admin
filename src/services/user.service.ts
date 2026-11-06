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

export const userService = {
  login: async (postBody: LoginDto): Promise<BaseVo<LoginVo>> => {
    const url = '/login'
    return api.post(url, postBody)
  },
  register: async (postBody: RegisterDto): Promise<BaseVo<void>> => {
    const url = '/register'
    return api.post(url, postBody)
  },
  getCaptcha: async (): Promise<BaseVo<string>> => {
    const url = '/getCaptcha'
    return api.get(url)
  },
  logout: async (): Promise<BaseVo<void>> => {
    const url = '/logout'
    return api.post(url)
  }
}
