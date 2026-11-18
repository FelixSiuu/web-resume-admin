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
  email: string
}

export interface VerifyEmailDto {
  token: string
}

export interface ForgotPasswordDto {
  email: string
  captcha: string
}

export interface ResetPasswordDto {
  token: string
  password: string
}

export interface ValidateResetTokenDto {
  token: string
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
  verifyEmail: async (postBody: VerifyEmailDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/verify-email`
    return api.post(url, postBody, { skipAuthRefresh: true })
  },
  forgotPassword: async (postBody: ForgotPasswordDto): Promise<BaseVo<CoolDownVo>> => {
    const url = `${basePath}/forgot-password`
    return api.post(url, postBody, { skipAuthRefresh: true })
  },
  resetPassword: async (postBody: ResetPasswordDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/reset-password`
    return api.post(url, postBody, { skipAuthRefresh: true })
  },
  validateResetToken: async (postBody: ValidateResetTokenDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/validate-reset-token`
    return api.post(url, postBody, { skipAuthRefresh: true })
  }
}
