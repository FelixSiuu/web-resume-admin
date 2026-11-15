'use client'

import { Button, Modal, Typography, message } from 'antd'
import { useDeleteAccountMutation } from '@/hooks/useAccountHooks'

const { Text, Title } = Typography

type MessageApi = ReturnType<typeof message.useMessage>[0]

type DeleteAccountSectionProps = {
  messageApi: MessageApi
}

const DeleteAccountSection = ({ messageApi }: DeleteAccountSectionProps) => {
  const { deleteAccount, isPendingDeleteAccount } = useDeleteAccountMutation()

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: 'Delete account?',
      content: 'This action cannot be undone. You will need to register again to use this admin system.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteAccount()
        } catch (error) {
          const errorText = error instanceof Error ? error.message : 'Failed to delete account'
          messageApi.error(errorText)
          throw error
        }
      }
    })
  }

  return (
    <>
      <Title level={5}>Delete Account</Title>
      <Text type="secondary" className="mb-4 block">
        Permanently delete your account and sign out. This cannot be undone.
      </Text>
      <Button danger loading={isPendingDeleteAccount} onClick={handleDeleteAccount}>
        Delete Account
      </Button>
    </>
  )
}

export default DeleteAccountSection
