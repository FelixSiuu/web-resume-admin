/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { clearAuthSession } from '@/services/auth-session'
import { useAuthStore } from '@/stores/auth.store'
import { getCookie } from '@/utils/cookie'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
    _retry?: boolean
  }

  export interface AxiosInstance {
    get(url: string, config: AxiosRequestConfig & { responseType: 'blob' }): Promise<Blob>
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<BaseVo<T>>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<BaseVo<T>>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<BaseVo<T>>
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<BaseVo<T>>
  }
}

const CSRF_COOKIE_NAME = 'XSRF_TOKEN'
const CSRF_HEADER_NAME = 'Xsrf-Token'
const CSRF_METHODS = new Set(['POST', 'PUT', 'DELETE'])
const AUTH_PATH_PREFIX = '/auth/'
const REFRESH_PATH = '/auth/refresh'

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isHandlingUnauthorized = false
let refreshPromise: Promise<void> | null = null

export const handleUnauthorized = () => {
  if (isHandlingUnauthorized) return

  isHandlingUnauthorized = true
  clearAuthSession()

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }

  setTimeout(() => {
    isHandlingUnauthorized = false
  }, 0)
}

const resolveXsrfToken = () => {
  // Prefer LoginVo value (works cross-origin). Cookie fallback helps same-site / localhost.
  return useAuthStore.getState().xsrfToken ?? getCookie(CSRF_COOKIE_NAME)
}

const isAuthRequest = (url?: string) => {
  if (!url) return false
  return url.includes(AUTH_PATH_PREFIX)
}

const refreshAccessToken = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const result = await api.post<LoginVo>(REFRESH_PATH, undefined, {
          skipAuthRefresh: true
        })

        if (!result.isSuccess) {
          throw new Error(result.message)
        }

        const { setUser, setXsrfToken } = useAuthStore.getState()
        setXsrfToken(result.data.xsrfToken)
        setUser({ username: result.data.username })
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase()
  if (!method || !CSRF_METHODS.has(method)) {
    return config
  }

  const xsrfToken = resolveXsrfToken()
  if (xsrfToken) {
    config.headers.set(CSRF_HEADER_NAME, xsrfToken)
  }

  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data as any
  },
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalConfig = error.config

    if (status === 500) {
      console.error('💥 伺服器內部錯誤 (500)')
      return Promise.reject(error)
    }

    if (status === 403) {
      console.error('⚠️ 校驗失敗或無權限 (403)')
      handleUnauthorized()
      return Promise.reject(error)
    }

    if (status === 401) {
      const shouldSkipRefresh =
        !originalConfig || originalConfig.skipAuthRefresh || originalConfig._retry || isAuthRequest(originalConfig.url)

      if (shouldSkipRefresh) {
        console.error('🔒 認證失效，請重新登入 (401)')
        handleUnauthorized()
        return Promise.reject(error)
      }

      try {
        await refreshAccessToken()
        originalConfig._retry = true
        return api(originalConfig)
      } catch {
        console.error('🔒 Refresh 失敗，請重新登入 (401)')
        handleUnauthorized()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
