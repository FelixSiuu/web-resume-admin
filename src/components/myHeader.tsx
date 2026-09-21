'use client'

import React from 'react'
import { Button, Layout, theme } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { clearAuthSession } from '@/services/auth-session'
import { useAuthStore } from '@/stores/auth.store'

const { Header } = Layout

const MyHeader = () => {
  const router = useRouter()
  const {
    token: { colorBgContainer }
  } = theme.useToken()
  const { user } = useAuthStore()

  const handleLogout = () => {
    clearAuthSession()
    router.push('/login')
  }

  return (
    <Header style={{ background: colorBgContainer }} className="flex justify-end items-center">
      {user?.username && <span className="mr-4">Hi, {user.username}</span>}
      <Button type="link" danger icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Button>
    </Header>
  )
}

export default MyHeader
