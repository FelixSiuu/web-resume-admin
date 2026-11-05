'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthUser = Pick<LoginVo, 'username'> | null

interface AuthState {
  user: AuthUser
  xsrfToken: string | null
  setUser: (user: AuthUser) => void
  setXsrfToken: (xsrfToken: string | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      xsrfToken: null,
      setUser: (user) => set({ user }),
      setXsrfToken: (xsrfToken) => set({ xsrfToken }),
      clearUser: () => set({ user: null, xsrfToken: null })
    }),
    {
      name: 'auth-user'
    }
  )
)
