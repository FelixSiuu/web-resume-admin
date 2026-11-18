'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { LockOutlined } from '@ant-design/icons'
import { Button, Form, Input, Result, Spin } from 'antd'
import { useResetPasswordMutation, useValidateResetTokenMutation } from '@/hooks/useUserHooks'

type ResetPasswordFormValues = {
  password: string
  confirmPassword: string
}

type ResetStatus = 'missing' | 'validating' | 'form' | 'invalid' | 'success' | 'error'

const ResetPasswordContent = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const [form] = Form.useForm<ResetPasswordFormValues>()
  const { resetPassword, isPendingResetPassword } = useResetPasswordMutation()
  const { validateResetToken } = useValidateResetTokenMutation()
  const requestedTokenRef = useRef<string | null>(null)
  const [status, setStatus] = useState<ResetStatus>(token ? 'validating' : 'missing')
  const [resultMessage, setResultMessage] = useState('')

  useEffect(() => {
    if (!token) return

    if (requestedTokenRef.current === token) return
    requestedTokenRef.current = token

    const run = async () => {
      setStatus('validating')
      try {
        await validateResetToken({ token })
        setStatus('form')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to validate reset link, please try again.'
        setResultMessage(message)
        setStatus('invalid')
      }
    }

    void run()
  }, [token, validateResetToken])

  const onFinish = async (values: ResetPasswordFormValues) => {
    try {
      const responseMessage = await resetPassword({
        token,
        password: values.password
      })
      setResultMessage(responseMessage)
      setStatus('success')
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Password reset failed, please try again.'
      setResultMessage(errorText)
      setStatus('error')
    }
  }

  if (!token || status === 'missing') {
    return (
      <Result
        status="warning"
        title="Missing reset token"
        subTitle="Open the link from your email to reset your password."
        extra={[
          <Link key="request" href="/forgot-password">
            <Button type="primary">Request a new link</Button>
          </Link>,
          <Link key="login" href="/login">
            <Button>Back to login</Button>
          </Link>
        ]}
      />
    )
  }

  if (status === 'validating') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span>Checking reset link...</span>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <Result
        status="error"
        title={resultMessage}
        extra={[
          <Link key="request" href="/forgot-password">
            <Button type="primary">Request a new link</Button>
          </Link>,
          <Link key="login" href="/login">
            <Button>Back to login</Button>
          </Link>
        ]}
      />
    )
  }

  if (status === 'success') {
    return (
      <Result
        status="success"
        title="Password reset"
        subTitle={resultMessage || undefined}
        extra={
          <Link href="/login">
            <Button type="primary">Back to login</Button>
          </Link>
        }
      />
    )
  }

  if (status === 'error') {
    return (
      <Result
        status="error"
        title="Password reset failed"
        subTitle={resultMessage}
        extra={[
          <Link key="request" href="/forgot-password">
            <Button type="primary">Request a new link</Button>
          </Link>,
          <Link key="login" href="/login">
            <Button>Back to login</Button>
          </Link>
        ]}
      />
    )
  }

  return (
    <Form
      form={form}
      name="reset-password"
      size="large"
      onFinish={onFinish}
      disabled={isPendingResetPassword}
      autoComplete="off"
      clearOnDestroy
    >
      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your new password!' },
          {
            pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/,
            message: 'Password must be 8-20 characters and include letters and numbers'
          }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="New password" allowClear autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your new password!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error('The two passwords do not match!'))
            }
          })
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" allowClear autoComplete="new-password" />
      </Form.Item>

      <Form.Item>
        <Button block type="primary" htmlType="submit" disabled={isPendingResetPassword}>
          {isPendingResetPassword ? 'submitting...' : 'Reset password'}
        </Button>
        <Link href="/login">
          <Button type="link" htmlType="button">
            Back to login
          </Button>
        </Link>
      </Form.Item>
    </Form>
  )
}

export default ResetPasswordContent
