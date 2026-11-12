'use client'

import React, { useState } from 'react'
import { Button, Layout, theme } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clearAuthSession } from '@/services/auth-session'
import { useAuthStore } from '@/stores/auth.store'
import { userService } from '@/services/user.service'

const { Header } = Layout

const MyHeader = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const {
    token: { colorBgContainer }
  } = theme.useToken()
  const { user } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const { isSuccess, message } = await userService.logout()
      if (!isSuccess) throw new Error(message)
    } catch {
      // Still clear local state; backend cookie clear is best-effort.
    } finally {
      queryClient.clear()
      clearAuthSession()
      setIsLoggingOut(false)
      router.push('/login')
    }
  }

  return (
    <Header style={{ background: colorBgContainer }} className="flex justify-end items-center">
      {user?.username && (
        <Link href="/overview/account" className="mr-4">
          Hi, {user.username}
        </Link>
      )}
      <Button type="link" danger icon={<LogoutOutlined />} loading={isLoggingOut} onClick={() => void handleLogout()}>
        Logout
      </Button>
    </Header>
  )
}

export default MyHeader
