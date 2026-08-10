'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthUser = Pick<LoginVo, 'username'> | null

interface AuthState {
  user: AuthUser
  setUser: (user: AuthUser) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'auth-user'
    }
  )
)
