import axios from 'axios'
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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** int64 cooldown may arrive as a number or a numeric string. Non-positive values become 0. */
const normalizeCooldownSeconds = (cd: unknown): number => {
  const value = typeof cd === 'string' && cd.trim() !== '' ? Number(cd) : cd
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
  return Math.floor(value)
}

const readCoolDownVo = (data: unknown): CoolDownVo | null => {
  if (!isRecord(data) || !('cd' in data)) return null
  return { cd: normalizeCooldownSeconds(data.cd) }
}

const parseForgotPasswordResponse = (value: unknown): BaseVo<CoolDownVo> | null => {
  if (!isRecord(value) || typeof value.message !== 'string') return null

  if (value.isSuccess === true) {
    return {
      isSuccess: true,
      code: 'OK',
      message: value.message,
      data: readCoolDownVo(value.data) ?? { cd: 0 }
    }
  }

  if (value.isSuccess === false) {
    return {
      isSuccess: false,
      code: typeof value.code === 'string' ? value.code : '',
      message: value.message,
      data: readCoolDownVo(value.data)
    }
  }

  return null
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
    try {
      const body = await api.post<CoolDownVo>(url, postBody, { skipAuthRefresh: true })
      const parsed = parseForgotPasswordResponse(body)
      if (!parsed) {
        throw new Error('Failed to send reset link, please try again.')
      }
      return parsed
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const parsed = parseForgotPasswordResponse(error.response?.data)
        if (parsed) return parsed
      }
      throw error
    }
  },
  resetPassword: async (postBody: ResetPasswordDto): Promise<BaseVo<void>> => {
    const url = `${basePath}/reset-password`
    return api.post(url, postBody, { skipAuthRefresh: true })
  }
}
