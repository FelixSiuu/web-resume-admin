'use client'

import { useEffect, useRef, useState } from 'react'
import type { InputRef } from 'antd'
import { Button, Form, Input, Modal, Typography } from 'antd'
import { useDeleteAccountMutation, useRequestDeleteTokenMutation } from '@/hooks/useAccountHooks'

const { Paragraph, Text, Title } = Typography

const VERIFICATION_CODE_PATTERN = /^[A-Za-z0-9]{6}$/

type DeleteStep = 'confirm' | 'verify'

type Notice = {
  message: string
  tone: 'default' | 'danger'
}

type DeleteCodeForm = {
  code: string
}

const resendLabel = (seconds: number) => (seconds > 0 ? `Resend in ${seconds}s` : 'Resend')

const cooldownSecondsFrom = (data: CoolDownVo | null | undefined): number | undefined => {
  if (!data || typeof data.cd !== 'number' || !Number.isFinite(data.cd)) return undefined
  return data.cd > 0 ? data.cd : 0
}

const toNotice = (message: string, tone: Notice['tone']): Notice | null => (message ? { message, tone } : null)

const isValidateError = (error: unknown): error is { errorFields: unknown } =>
  typeof error === 'object' && error !== null && 'errorFields' in error

const DeleteAccountSection = () => {
  const [form] = Form.useForm<DeleteCodeForm>()
  const codeValue = Form.useWatch('code', form)
  const codeInputRef = useRef<InputRef>(null)
  const openRef = useRef(false)
  const inFlight = useRef(false)
  const requestGeneration = useRef(0)
  const { deleteAccount, isPendingDeleteAccount } = useDeleteAccountMutation()
  const { requestDeleteToken, isPendingRequestDeleteToken } = useRequestDeleteTokenMutation()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<DeleteStep>('confirm')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [showUnverifiedPrompt, setShowUnverifiedPrompt] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const busy = isPendingRequestDeleteToken || isPendingDeleteAccount
  const hasCode = typeof codeValue === 'string' && codeValue.trim().length > 0

  useEffect(() => {
    if (cooldownSeconds <= 0) return undefined

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldownSeconds])

  useEffect(() => {
    if (!open || step !== 'verify') return undefined

    const timer = window.setTimeout(() => {
      codeInputRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [open, step])

  const resetFlow = () => {
    setStep('confirm')
    setNotice(null)
    setShowUnverifiedPrompt(false)
    setCooldownSeconds(0)
    form.resetFields()
  }

  const applyCooldown = (data: CoolDownVo | null | undefined) => {
    const seconds = cooldownSecondsFrom(data)
    if (seconds === undefined) return
    setCooldownSeconds(seconds)
  }

  const handleOpen = () => {
    resetFlow()
    openRef.current = true
    setOpen(true)
  }

  const handleClose = () => {
    requestGeneration.current += 1
    openRef.current = false
    setOpen(false)
  }

  const handleAfterClose = () => {
    if (openRef.current) return
    resetFlow()
  }

  const handleSendCode = async () => {
    if (inFlight.current || busy) return

    inFlight.current = true
    const generation = requestGeneration.current
    const startedOnConfirm = step === 'confirm'

    try {
      const result = await requestDeleteToken()
      if (generation !== requestGeneration.current) return

      if (result.isSuccess) {
        applyCooldown(result.data)
        setNotice(toNotice(result.message, 'default'))
        setShowUnverifiedPrompt(false)
        setStep('verify')
        return
      }

      const seconds = cooldownSecondsFrom(result.data)
      if (seconds !== undefined) {
        setCooldownSeconds(seconds)
        setNotice(toNotice(result.message, 'danger'))
        setShowUnverifiedPrompt(false)
        setStep('verify')
        return
      }

      setNotice(toNotice(result.message, 'danger'))
      if (startedOnConfirm) {
        setShowUnverifiedPrompt(result.data == null)
        return
      }

      setShowUnverifiedPrompt(false)
    } catch (error) {
      if (generation !== requestGeneration.current) return
      const errorText = error instanceof Error ? error.message : 'Failed to send verification code'
      setNotice({ message: errorText, tone: 'danger' })
      if (startedOnConfirm) setShowUnverifiedPrompt(false)
    } finally {
      inFlight.current = false
    }
  }

  const handleDelete = async () => {
    if (inFlight.current || busy) return

    inFlight.current = true
    const generation = requestGeneration.current

    try {
      const values = await form.validateFields()
      if (generation !== requestGeneration.current) return
      const code = values.code.trim()
      await deleteAccount({ code })
    } catch (error) {
      if (generation !== requestGeneration.current || isValidateError(error)) return
      const errorText = error instanceof Error ? error.message : 'Failed to delete account'
      form.setFields([{ name: 'code', errors: [errorText] }])
    } finally {
      inFlight.current = false
    }
  }

  return (
    <>
      <Title level={5}>Delete Account</Title>
      <Text type="secondary" className="mb-4 block">
        Permanently delete your account and sign out. This cannot be undone.
      </Text>
      <Button danger onClick={handleOpen}>
        Delete Account
      </Button>

      <Modal
        title="Delete account?"
        open={open}
        onCancel={handleClose}
        afterClose={handleAfterClose}
        okText={step === 'confirm' ? 'Send verification code' : 'Permanently delete'}
        okType={step === 'verify' ? 'danger' : 'primary'}
        cancelText="Cancel"
        confirmLoading={step === 'verify' ? isPendingDeleteAccount : isPendingRequestDeleteToken}
        okButtonProps={{
          disabled: busy || (step === 'verify' && !hasCode)
        }}
        onOk={() => {
          if (step === 'confirm') {
            void handleSendCode()
            return
          }
          void handleDelete()
        }}
        destroyOnHidden
      >
        {step === 'confirm' ? (
          <>
            <Paragraph>
              This action cannot be undone. You will need to register again to use this admin system.
            </Paragraph>
            <Paragraph className="mb-0">
              Clicking Send verification code will send a verification code to your email.
            </Paragraph>
            {notice && (
              <Paragraph type={notice.tone === 'danger' ? 'danger' : undefined} className="mt-3 mb-0">
                {notice.message}
              </Paragraph>
            )}
            {showUnverifiedPrompt && (
              <Paragraph className="mt-3 mb-0">Verify your email first in the Email section on this page.</Paragraph>
            )}
          </>
        ) : (
          <>
            {notice && (
              <Paragraph type={notice.tone === 'danger' ? 'danger' : undefined}>
                {notice.message}
              </Paragraph>
            )}
            <Paragraph>This action cannot be undone.</Paragraph>
            <Form form={form} layout="vertical" requiredMark={false} autoComplete="off" disabled={busy} onFinish={() => void handleDelete()}>
              <Form.Item
                name="code"
                label="Verification code"
                rules={[
                  {
                    validator: async (_, value: unknown) => {
                      const code = typeof value === 'string' ? value.trim() : ''
                      if (!code) throw new Error('Please enter the verification code.')
                      if (!VERIFICATION_CODE_PATTERN.test(code)) {
                        throw new Error('Enter a 6-character code using letters and numbers.')
                      }
                    }
                  }
                ]}
              >
                <Input
                  ref={codeInputRef}
                  autoFocus
                  autoComplete="one-time-code"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={6}
                  placeholder="Verification code"
                />
              </Form.Item>
              <Button
                type="link"
                htmlType="button"
                className="px-0"
                disabled={cooldownSeconds > 0 || busy}
                onClick={() => void handleSendCode()}
              >
                {resendLabel(cooldownSeconds)}
              </Button>
            </Form>
          </>
        )}
      </Modal>
    </>
  )
}

export default DeleteAccountSection
