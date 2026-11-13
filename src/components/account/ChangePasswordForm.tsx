'use client'

import { LockOutlined } from '@ant-design/icons'
import { Button, Form, Input, Typography, message } from 'antd'
import { useChangePasswordMutation } from '@/hooks/useAccountHooks'

const { Title } = Typography

type MessageApi = ReturnType<typeof message.useMessage>[0]

type ChangePasswordFormValues = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

type ChangePasswordFormProps = {
  messageApi: MessageApi
}

const ChangePasswordForm = ({ messageApi }: ChangePasswordFormProps) => {
  const [form] = Form.useForm<ChangePasswordFormValues>()
  const { changePassword, isPendingChangePassword } = useChangePasswordMutation()

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

  return (
    <>
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
    </>
  )
}

export default ChangePasswordForm
