'use client'

import { MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, Tag, Typography, message } from 'antd'
import { useEmailQuery, useUpdateEmailMutation } from '@/hooks/useAccountHooks'

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
  const { emailStatus, isLoadingEmail } = useEmailQuery()
  const { updateEmail, isPendingUpdateEmail } = useUpdateEmailMutation()

  const onFinish = async (values: BindEmailFormValues) => {
    try {
      const result = await updateEmail({ email: values.email.trim() })
      messageApi.success(result.nextStepMessage || 'Email bound. Please check your inbox to verify.')
      form.resetFields()
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Failed to bind email'
      messageApi.error(errorText)
    }
  }

  const hasEmail = Boolean(emailStatus?.email)

  return (
    <>
      <Title level={5}>Bind Email</Title>

      {(hasEmail || emailStatus?.nextStepMessage) && (
        <div className="mb-4">
          {hasEmail && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Text>{emailStatus?.email}</Text>
              <Tag color={emailStatus?.verified ? 'success' : 'orange'}>{emailStatus?.verified ? 'Verified' : 'Unverified'}</Tag>
            </div>
          )}
          {emailStatus?.nextStepMessage && (
            <Text type={hasEmail ? 'secondary' : 'danger'} className="block">
              {emailStatus.nextStepMessage}
            </Text>
          )}
        </div>
      )}

      <Form
        form={form}
        name="bind-email"
        layout="vertical"
        onFinish={onFinish}
        disabled={isPendingUpdateEmail || isLoadingEmail}
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
          <Button type="primary" htmlType="submit" loading={isPendingUpdateEmail}>
            Bind Email
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default BindEmailForm
