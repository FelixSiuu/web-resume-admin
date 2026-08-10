'use client'

import { useState } from 'react'
import { UserOutlined, StarOutlined, HistoryOutlined, BookOutlined, FilePdfOutlined, ContactsOutlined } from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { usePathname, useRouter } from 'next/navigation'

const { Sider } = Layout

const MenuItems = [
  {
    key: '/overview/aboutme',
    icon: <UserOutlined />,
    label: 'About Me'
  },
  {
    key: '/overview/coreskills',
    icon: <StarOutlined />,
    label: 'Core Skills'
  },
  {
    key: '/overview/workingexperience',
    icon: <HistoryOutlined />,
    label: 'Working Experience'
  },
  {
    key: '/overview/education',
    icon: <BookOutlined />,
    label: 'Education'
  },
  {
    key: '/overview/contact',
    icon: <ContactsOutlined />,
    label: 'Contact'
  },
  {
    key: '/overview/export-pdf',
    icon: <FilePdfOutlined />,
    label: 'Export PDF'
  }
]

export default function MySider() {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const onClick: MenuProps['onClick'] = (e) => {
    router.push(e.key)
  }

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
      <Menu theme="dark" mode="inline" items={MenuItems} selectedKeys={[pathname]} onClick={onClick} />
    </Sider>
  )
}
