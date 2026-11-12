'use client'

import { LockOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Form, Input, Modal, Typography, message } from 'antd'
import { useChangePasswordMutation, useDeleteAccountMutation } from '@/hooks/useAccountHooks'
import { useAuthStore } from '@/stores/auth.store'

const { Text, Title } = Typography

type ChangePasswordFormValues = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const AccountCard = () => {
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const { user } = useAuthStore()
  const [messageApi, contextHolder] = message.useMessage()
  const { changePassword, isPendingChangePassword } = useChangePasswordMutation()
  const { deleteAccount, isPendingDeleteAccount } = useDeleteAccountMutation()

  const onFinish = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      })
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Failed to update password'
      messageApi.error(errorText)
    }
  }

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
      {contextHolder}
      <Card>
        {user?.username && (
          <Text type="secondary" className="mb-4 block">
            Username: {user.username}
          </Text>
        )}

        <Title level={5}>Change Password</Title>
        <Form
          form={form}
          name="change-password"
          layout="vertical"
          onFinish={onFinish}
          disabled={isPendingChangePassword}
          autoComplete="off"
          style={{ maxWidth: 400 }}
        >
          <Form.Item name="oldPassword" label="Current password" rules={[{ required: true, message: 'Please input your current password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Current password" allowClear />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/,
                message: 'Password must be 8-20 characters and include letters and numbers'
              }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="8-20 chars, letters and numbers" allowClear />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm new password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('The two passwords do not match!'))
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" allowClear />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isPendingChangePassword}>
              Update Password
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Title level={5}>Delete Account</Title>
        <Text type="secondary" className="mb-4 block">
          Permanently delete your account and sign out. This cannot be undone.
        </Text>
        <Button danger loading={isPendingDeleteAccount} onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </Card>
    </>
  )
}

export default AccountCard
