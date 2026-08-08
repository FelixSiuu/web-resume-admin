/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'
import { clearAuthSession } from '@/services/auth-session'

declare module 'axios' {
  export interface AxiosInstance {
    get(url: string, config: AxiosRequestConfig & { responseType: 'blob' }): Promise<Blob>
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<BaseVo<T>>
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<BaseVo<T>>
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<BaseVo<T>>
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<BaseVo<T>>
  }
}

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let isHandlingUnauthorized = false

const handleUnauthorized = () => {
  if (isHandlingUnauthorized) return

  isHandlingUnauthorized = true
  clearAuthSession()

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login')
  }

  // Allow handling future 401 events after this tick.
  setTimeout(() => {
    isHandlingUnauthorized = false
  }, 0)
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response 攔截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data as any
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 500:
          console.error('💥 伺服器內部錯誤 (500)')
          break
        case 401: {
          console.error('🔒 認證失效，請重新登入 (401)')
          handleUnauthorized()
          break
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
