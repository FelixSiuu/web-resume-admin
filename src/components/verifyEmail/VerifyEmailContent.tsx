'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Result, Spin } from 'antd'
import { useVerifyEmailMutation } from '@/hooks/useUserHooks'
import { useAuthStore } from '@/stores/auth.store'

type VerifyStatus = 'missing' | 'verifying' | 'success' | 'error'

const VerifyEmailContent = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const queryClient = useQueryClient()
  const { verifyEmail } = useVerifyEmailMutation()
  const requestedTokenRef = useRef<string | null>(null)
  const [status, setStatus] = useState<VerifyStatus>(token ? 'verifying' : 'missing')
  const [errorMessage, setErrorMessage] = useState('Verification failed.')

  useEffect(() => {
    if (!token) return

    if (requestedTokenRef.current === token) return
    requestedTokenRef.current = token

    const run = async () => {
      setStatus('verifying')
      try {
        await verifyEmail({ token })
        // Refresh account email status when a session may already be present.
        if (useAuthStore.getState().user) {
          await queryClient.invalidateQueries({ queryKey: ['getAccountEmail'] })
        }
        setStatus('success')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Verification failed.'
        setErrorMessage(message)
        setStatus('error')
      }
    }

    void run()
  }, [token, verifyEmail, queryClient])

  if (status === 'missing') {
    return (
      <Result
        status="warning"
        title="Missing verification token"
        subTitle="Open the link from your email to verify your address."
        extra={
          <Link href="/login">
            <Button type="primary">Back to login</Button>
          </Link>
        }
      />
    )
  }

  if (status === 'verifying') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spin size="large" />
        <span>Verifying email...</span>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <Result
        status="success"
        title="Email verified"
        subTitle="Your email has been verified successfully."
        extra={
          <Link href="/overview/account">
            <Button type="primary">Go to account</Button>
          </Link>
        }
      />
    )
  }

  return (
    <Result
      status="error"
      title="Verification failed"
      subTitle={errorMessage}
      extra={
        <Link href="/login">
          <Button type="primary">Back to login</Button>
        </Link>
      }
    />
  )
}

export default VerifyEmailContent
