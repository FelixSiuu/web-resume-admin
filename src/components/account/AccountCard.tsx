'use client'

import { Card, Divider, Typography, message } from 'antd'
import { useAuthStore } from '@/stores/auth.store'
import BindEmailForm from './BindEmailForm'
import ChangePasswordForm from './ChangePasswordForm'
import DeleteAccountSection from './DeleteAccountSection'

const { Text } = Typography

const AccountCard = () => {
  const { user } = useAuthStore()
  const [messageApi, contextHolder] = message.useMessage()

  return (
    <>
      {contextHolder}
      <Card>
        {user?.username && (
          <Text type="secondary" className="mb-4 block">
            Username: {user.username}
          </Text>
        )}

        <BindEmailForm messageApi={messageApi} />

        <Divider />

        <ChangePasswordForm messageApi={messageApi} />

        <Divider />

        <DeleteAccountSection messageApi={messageApi} />
      </Card>
    </>
  )
}

export default AccountCard
