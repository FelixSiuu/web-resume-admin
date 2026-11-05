'use client'

import { useMemo, useState } from 'react'
import { UserOutlined, StarOutlined, HistoryOutlined, BookOutlined, FilePdfOutlined, ContactsOutlined, ProjectOutlined } from '@ant-design/icons'
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
    key: '/overview/projects',
    icon: <ProjectOutlined />,
    label: 'Projects'
  },
  {
    key: '/overview/export-pdf',
    icon: <FilePdfOutlined />,
    label: 'Export PDF'
  }
]

const resolveSelectedKey = (pathname: string) => {
  const match = MenuItems.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
  return match?.key ?? pathname
}

export default function MySider() {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const selectedKey = useMemo(() => resolveSelectedKey(pathname), [pathname])

  const onClick: MenuProps['onClick'] = (e) => {
    router.push(e.key)
  }

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
      <Menu theme="dark" mode="inline" items={MenuItems} selectedKeys={[selectedKey]} onClick={onClick} />
    </Sider>
  )
}
