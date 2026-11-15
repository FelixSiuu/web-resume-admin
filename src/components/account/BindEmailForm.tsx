'use client'

import { useState } from 'react'
import { MailOutlined } from '@ant-design/icons'
import { Button, Form, Input, Modal, Space, Tag, Typography, message } from 'antd'
import { useEmailQuery, useUpdateEmailMutation } from '@/hooks/useAccountHooks'

const { Text, Title } = Typography

type MessageApi = ReturnType<typeof message.useMessage>[0]

type BindEmailFormValues = {
  email: string
}

type BindEmailFormProps = {
  messageApi: MessageApi
}

const isValidEmail = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  const email = value.trim()
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const BindEmailForm = ({ messageApi }: BindEmailFormProps) => {
  const [form] = Form.useForm<BindEmailFormValues>()
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const { emailStatus, isLoadingEmail } = useEmailQuery()
  const { updateEmail, isPendingUpdateEmail } = useUpdateEmailMutation()

  const resolveEmail = (preferred?: string) => {
    if (isValidEmail(preferred)) return preferred.trim()
    const formEmail = form.getFieldValue('email')
    if (isValidEmail(formEmail)) return formEmail.trim()
    return emailStatus?.email?.trim() || ''
  }

  const submitEmail = async (email: string) => {
    if (!email) {
      messageApi.error('Please input a valid email!')
      return
    }

    try {
      await updateEmail({ email })
      form.resetFields()
      setIsChangingEmail(false)
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Failed to bind email'
      messageApi.error(errorText)
    }
  }

  const onFinish = async (values: BindEmailFormValues) => {
    await submitEmail(resolveEmail(values.email))
  }

  const handleVerifyEmail = async () => {
    await submitEmail(resolveEmail())
  }

  const handleChangeEmail = () => {
    Modal.confirm({
      title: 'Change email?',
      content: emailStatus?.verified
        ? 'Changing your email will require verification again.'
        : 'The new email address will need to be verified.',
      okText: 'Yes',
      cancelText: 'Cancel',
      onOk: () => {
        if (emailStatus?.email) {
          form.setFieldsValue({ email: emailStatus.email })
        }
        setIsChangingEmail(true)
      }
    })
  }

  const handleCancelChangeEmail = () => {
    form.resetFields()
    setIsChangingEmail(false)
  }

  const hasEmail = Boolean(emailStatus?.email)
  const isVerified = Boolean(emailStatus?.verified)
  const showBindForm = !hasEmail || isChangingEmail
  const showUnverifiedActions = hasEmail && !isVerified && !isChangingEmail
  const showVerifiedActions = hasEmail && isVerified && !isChangingEmail
  const sectionTitle = hasEmail ? 'Email' : 'Bind Email'
  const submitLabel = isChangingEmail ? 'Update Email' : 'Bind Email'

  return (
    <>
      <Title level={5}>{sectionTitle}</Title>

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

      {showBindForm && (
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
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={isPendingUpdateEmail}>
                {submitLabel}
              </Button>
              {isChangingEmail && (
                <Button type="default" disabled={isPendingUpdateEmail} onClick={handleCancelChangeEmail}>
                  Cancel
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      )}

      {showUnverifiedActions && (
        <Space wrap>
          <Button type="primary" loading={isPendingUpdateEmail} disabled={isLoadingEmail} onClick={() => void handleVerifyEmail()}>
            Resend verification
          </Button>
          <Button type="default" disabled={isLoadingEmail || isPendingUpdateEmail} onClick={handleChangeEmail}>
            Change Email
          </Button>
        </Space>
      )}

      {showVerifiedActions && (
        <Button type="default" onClick={handleChangeEmail} disabled={isLoadingEmail}>
          Change Email
        </Button>
      )}
    </>
  )
}

export default BindEmailForm
