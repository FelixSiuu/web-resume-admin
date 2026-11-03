import Cookies from 'js-cookie'
import { useAuthStore } from '@/stores/auth.store'

/** Matches backend JWT lifetime (24h). Longer cookie alone cannot extend auth. */
const REMEMBER_ME_DAYS = 1

type SetAuthTokenOptions = {
  rememberMe: boolean
}

export const setAuthToken = (token: string, { rememberMe }: SetAuthTokenOptions) => {
  Cookies.set('token', token, {
    ...(rememberMe ? { expires: REMEMBER_ME_DAYS } : {}),
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
}

export const clearAuthSession = () => {
  Cookies.remove('token', { path: '/' })
  useAuthStore.getState().clearUser()
}
