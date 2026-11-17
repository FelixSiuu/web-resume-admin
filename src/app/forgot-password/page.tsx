'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LoadingOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Image, Input, Result, message } from 'antd'
import { useCaptchaQuery, useForgotPasswordMutation } from '@/hooks/useUserHooks'
import { ForgotPasswordError } from '@/services/user.service'

type ForgotPasswordFormValues = {
  email: string
  captcha: string
}

const trimValue = (value: unknown) => (typeof value === 'string' ? value.trim() : value)

const cooldownLabel = (seconds: number, idleLabel: string) => (seconds > 0 ? `Resend in ${seconds}s` : idleLabel)

const ForgotPassword = () => {
  const [form] = Form.useForm<ForgotPasswordFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const { captchaImgUrl, isFetchingCaptcha, refreshCaptcha } = useCaptchaQuery()
  const { forgotPassword, isPendingForgotPassword } = useForgotPasswordMutation()
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldownSeconds])

  useEffect(() => {
    if (successMessage !== null || !submittedEmail) return
    form.setFieldValue('email', submittedEmail)
    form.setFieldValue('captcha', '')
  }, [form, submittedEmail, successMessage])

  const startCooldown = (cd: number) => {
    if (cd > 0) setCooldownSeconds(cd)
  }

  const onFinish = async (values: ForgotPasswordFormValues) => {
    const email = values.email.trim()

    messageApi.open({
      type: 'loading',
      content: 'Submitting...',
      duration: 0
    })

    try {
      const result = await forgotPassword({
        email,
        captcha: values.captcha
      })
      messageApi.destroy()
      setSubmittedEmail(email)
      startCooldown(result.cd)
      setSuccessMessage(result.message)
    } catch (error) {
      messageApi.destroy()
      const errorText = error instanceof Error ? error.message : 'Failed to send reset link, please try again.'
      messageApi.error(errorText)
      refreshCaptcha()
      form.setFieldValue('captcha', '')
      if (error instanceof ForgotPasswordError) {
        startCooldown(error.cd)
      }
    }
  }

  // The API requires a new captcha, so resend only returns to the form.
  const handleResend = () => {
    form.setFieldValue('email', submittedEmail)
    form.setFieldValue('captcha', '')
    setSuccessMessage(null)
    refreshCaptcha()
  }

  const submitLabel = isPendingForgotPassword ? 'submitting...' : cooldownLabel(cooldownSeconds, 'Send reset link')

  return (
    <main className="min-h-screen flex justify-center items-center">
      {contextHolder}

      <div className="w-full max-w-120 p-4">
        {successMessage !== null ? (
          <Result
            status="success"
            title="Check your email"
            subTitle={successMessage}
            extra={[
              <Button key="resend" type="primary" htmlType="button" disabled={cooldownSeconds > 0} onClick={handleResend}>
                {cooldownLabel(cooldownSeconds, 'Resend')}
              </Button>,
              <Link key="login" href="/login">
                <Button htmlType="button">Back to login</Button>
              </Link>
            ]}
          />
        ) : (
          <Form
            form={form}
            name="forgot-password"
            size="large"
            onFinish={onFinish}
            disabled={isPendingForgotPassword}
            initialValues={{ email: submittedEmail }}
            autoComplete="off"
            clearOnDestroy
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, whitespace: true, message: 'Please input your email!', transform: trimValue },
                { type: 'email', message: 'Please input a valid email!', transform: trimValue }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" allowClear autoComplete="email" />
            </Form.Item>

            <Form.Item name="captcha" rules={[{ required: true, message: 'Please input Captcha!' }]}>
              <Input prefix={<SafetyOutlined />} placeholder="Captcha" allowClear />
            </Form.Item>

            <Form.Item>
              <Flex justify="space-between" align="center">
                <Image src={captchaImgUrl} width={160} height={40} alt="captcha" placeholder={<LoadingOutlined />} />

                <Button htmlType="button" onClick={refreshCaptcha} disabled={isFetchingCaptcha}>
                  refresh captcha
                </Button>
              </Flex>
            </Form.Item>

            <Form.Item>
              <Button block type="primary" htmlType="submit" disabled={isPendingForgotPassword || cooldownSeconds > 0}>
                {submitLabel}
              </Button>
              <Link href="/login">Back to login</Link>
            </Form.Item>
          </Form>
        )}
      </div>
    </main>
  )
}

export default ForgotPassword
