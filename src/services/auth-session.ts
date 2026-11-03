import { useAuthStore } from '@/stores/auth.store'

/** Clears client-only auth state. HttpOnly ACCESS_TOKEN must be cleared by the backend. */
export const clearAuthSession = () => {
  useAuthStore.getState().clearUser()
}
