'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoadingOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Image, Input, Result, message } from 'antd'
import { useCaptchaQuery, useForgotPasswordMutation } from '@/hooks/useUserHooks'

type ForgotPasswordFormValues = {
  email: string
  captcha: string
}

const trimValue = (value: unknown) => (typeof value === 'string' ? value.trim() : value)

const ForgotPassword = () => {
  const [form] = Form.useForm<ForgotPasswordFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const { captchaImgUrl, isFetchingCaptcha, refreshCaptcha } = useCaptchaQuery()
  const { forgotPassword, isPendingForgotPassword } = useForgotPasswordMutation()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onFinish = async (values: ForgotPasswordFormValues) => {
    messageApi.open({
      type: 'loading',
      content: 'Submitting...',
      duration: 0
    })

    try {
      const responseMessage = await forgotPassword({
        email: values.email.trim(),
        captcha: values.captcha
      })
      messageApi.destroy()
      setSuccessMessage(responseMessage)
    } catch (error) {
      messageApi.destroy()
      const errorText = error instanceof Error ? error.message : 'Failed to send reset link, please try again.'
      messageApi.error(errorText)
      refreshCaptcha()
      form.setFieldValue('captcha', '')
    }
  }

  return (
    <main className="min-h-screen flex justify-center items-center">
      {contextHolder}

      <div className="w-full max-w-120 p-4">
        {successMessage !== null ? (
          <Result
            status="success"
            title="Check your email"
            subTitle={successMessage}
            extra={
              <Link href="/login">
                <Button type="primary">Back to login</Button>
              </Link>
            }
          />
        ) : (
          <Form
            form={form}
            name="forgot-password"
            size="large"
            onFinish={onFinish}
            disabled={isPendingForgotPassword}
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
              <Button block type="primary" htmlType="submit" disabled={isPendingForgotPassword}>
                {isPendingForgotPassword ? 'submitting...' : 'Send reset link'}
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
