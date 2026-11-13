'use client'

import { useState } from 'react'
import { MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, Tag, Typography, message } from 'antd'
import { useBindEmailMutation } from '@/hooks/useAccountHooks'
import type { BoundEmailVo } from '@/services/account.service'

const { Text, Title } = Typography

type MessageApi = ReturnType<typeof message.useMessage>[0]

type BindEmailFormValues = {
  email: string
}

type BindEmailFormProps = {
  messageApi: MessageApi
}

const BindEmailForm = ({ messageApi }: BindEmailFormProps) => {
  const [form] = Form.useForm<BindEmailFormValues>()
  const [boundEmail, setBoundEmail] = useState<BoundEmailVo | null>(null)
  const { bindEmail, isPendingBindEmail } = useBindEmailMutation()

  const onFinish = async (values: BindEmailFormValues) => {
    try {
      const result = await bindEmail({ email: values.email.trim() })
      setBoundEmail(result)
      messageApi.success('Email bound. Please check your inbox to verify.')
      form.resetFields()
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Failed to bind email'
      messageApi.error(errorText)
    }
  }

  return (
    <>
      <Title level={5}>Bind Email</Title>

      {boundEmail && (
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Text>{boundEmail.email}</Text>
            <Tag color={boundEmail.verified ? 'success' : 'orange'}>{boundEmail.verified ? 'Verified' : 'Unverified'}</Tag>
          </div>
          {!boundEmail.verified && (
            <Text type="secondary" className="block">
              A verification email has been sent. Please check your inbox to complete verification.
            </Text>
          )}
        </div>
      )}

      <Form
        form={form}
        name="bind-email"
        layout="vertical"
        onFinish={onFinish}
        disabled={isPendingBindEmail}
        autoComplete="off"
        style={{ maxWidth: 400 }}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please input a valid email!' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="you@example.com" allowClear />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isPendingBindEmail}>
            Bind Email
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default BindEmailForm
