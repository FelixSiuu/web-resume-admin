import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DeleteAccountSection from './DeleteAccountSection'

beforeAll(() => {
  const original = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudoElt?: string | null) => {
    if (pseudoElt) {
      return { getPropertyValue: () => '' } as unknown as CSSStyleDeclaration
    }
    return original(element)
  })
})

const successBody = (message: string, cd: number) => ({
  isSuccess: true as const,
  code: 'OK' as const,
  message,
  data: { cd }
})

const { requestDeleteTokenMock, deleteAccountMock, pendingState } = vi.hoisted(() => ({
  requestDeleteTokenMock: vi.fn(),
  deleteAccountMock: vi.fn(),
  pendingState: { isPendingRequestDeleteToken: false, isPendingDeleteAccount: false }
}))

vi.mock('@/hooks/useAccountHooks', () => ({
  useRequestDeleteTokenMutation: () => ({
    requestDeleteToken: requestDeleteTokenMock,
    isPendingRequestDeleteToken: pendingState.isPendingRequestDeleteToken
  }),
  useDeleteAccountMutation: () => ({
    deleteAccount: deleteAccountMock,
    isPendingDeleteAccount: pendingState.isPendingDeleteAccount
  })
}))

const setupUser = () => userEvent.setup({ delay: null })

const openDialog = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole('button', { name: 'Delete Account' }))
  expect(await screen.findByRole('dialog')).toBeInTheDocument()
}

const sendCode = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole('button', { name: 'Send verification code' }))
}

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    requestDeleteTokenMock.mockReset()
    deleteAccountMock.mockReset()
    pendingState.isPendingRequestDeleteToken = false
    pendingState.isPendingDeleteAccount = false
  })

  it('opens a warning step and does not delete until a code is confirmed', async () => {
    const user = setupUser()
    render(<DeleteAccountSection />)

    await openDialog(user)

    expect(screen.getByText('This action cannot be undone. You will need to register again to use this admin system.')).toBeInTheDocument()
    expect(screen.getByText('Clicking Send verification code will send a verification code to your email.')).toBeInTheDocument()
    const sendButton = screen.getByRole('button', { name: 'Send verification code' })
    expect(sendButton).toHaveClass('ant-btn-primary')
    expect(sendButton).not.toHaveClass('ant-btn-dangerous')
    expect(screen.queryByRole('button', { name: 'Permanently delete' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog').textContent).not.toMatch(/@/)
    expect(deleteAccountMock).not.toHaveBeenCalled()
    expect(requestDeleteTokenMock).not.toHaveBeenCalled()
  })

  it('stays in the dialog after a successful send and deletes with the entered code', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce(
      successBody("We've sent a verification code to your email. Please check your inbox.", 0)
    )
    deleteAccountMock.mockResolvedValueOnce(undefined)

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    expect(requestDeleteTokenMock).toHaveBeenCalledTimes(1)
    expect(await screen.findByText("We've sent a verification code to your email. Please check your inbox.")).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend' })).toHaveClass('ant-btn-link')
    expect(screen.getByRole('button', { name: 'Resend' })).not.toHaveClass('ant-btn-dangerous')

    const deleteButton = screen.getByRole('button', { name: 'Permanently delete' })
    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveClass('ant-btn-dangerous')
    expect(deleteButton).not.toHaveClass('ant-btn-primary')

    const input = screen.getByRole('textbox', { name: 'Verification code' })
    await waitFor(() => expect(input).toHaveFocus())
    await user.type(input, 'AbC123')
    expect(deleteButton).toBeEnabled()
    await user.click(deleteButton)

    await waitFor(() => expect(deleteAccountMock).toHaveBeenCalledWith({ code: 'AbC123' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows the API message for a different success body instead of a hardcoded sentence', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce(successBody('Delete code sent.', 0))

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    expect(await screen.findByText('Delete code sent.')).toBeInTheDocument()
    expect(screen.queryByText("We've sent a verification code to your email. Please check your inbox.")).not.toBeInTheDocument()
  })

  it('disables resend until the backend cooldown ends', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce(successBody('Delete code sent.', 1))

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    expect(await screen.findByRole('button', { name: 'Resend in 1s' })).toBeDisabled()
    const resend = await screen.findByRole('button', { name: 'Resend' }, { timeout: 2000 })
    expect(resend).toBeEnabled()
  })

  it('stays on the warning step when the email is not verified', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'EMAIL_UNVERIFIED',
      message: 'Please verify your email before deleting your account.',
      data: null
    })

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    expect(await screen.findByText('Please verify your email before deleting your account.')).toBeInTheDocument()
    expect(screen.getByText('Verify your email first in the Email section on this page.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send verification code' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Verification code' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Permanently delete' })).not.toBeInTheDocument()
    expect(deleteAccountMock).not.toHaveBeenCalled()
  })

  it('starts the countdown from a failed send when cooldown data is present', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce({
      isSuccess: false,
      code: 'RATE_LIMIT',
      message: 'Please wait before requesting another code.',
      data: { cd: 12 }
    })

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    expect(await screen.findByText('Please wait before requesting another code.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend in 12s' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Verification code' })).toBeInTheDocument()
    expect(screen.queryByText('Verify your email first in the Email section on this page.')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and shows a wrong code on the input', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce(successBody('Delete code sent.', 25))
    deleteAccountMock.mockRejectedValueOnce(new Error('Verification code is incorrect'))

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    const input = await screen.findByRole('textbox', { name: 'Verification code' })
    await user.type(input, 'AbC123')
    await user.click(screen.getByRole('button', { name: 'Permanently delete' }))

    expect(await screen.findByText('Verification code is incorrect')).toBeInTheDocument()
    expect(input).toHaveValue('AbC123')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend in 25s' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Send verification code' })).not.toBeInTheDocument()
    expect(deleteAccountMock).toHaveBeenCalledTimes(1)
  })

  it('does not submit a code that is not 6 letters or numbers', async () => {
    requestDeleteTokenMock.mockResolvedValueOnce(successBody('Delete code sent.', 0))

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    const input = await screen.findByRole('textbox', { name: 'Verification code' })
    await user.type(input, '12ab!@')
    await user.click(screen.getByRole('button', { name: 'Permanently delete' }))

    expect(await screen.findByText('Enter a 6-character code using letters and numbers.')).toBeInTheDocument()
    expect(deleteAccountMock).not.toHaveBeenCalled()
  })

  it('does not delete when the dialog is cancelled, and the next send uses the new cooldown', async () => {
    requestDeleteTokenMock
      .mockResolvedValueOnce(successBody('Delete code sent.', 40))
      .mockResolvedValueOnce(successBody('Delete code sent again.', 7))

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)
    expect(await screen.findByRole('button', { name: 'Resend in 40s' })).toBeDisabled()

    await user.type(screen.getByRole('textbox', { name: 'Verification code' }), 'AbC123')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(deleteAccountMock).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await openDialog(user)
    expect(screen.getByRole('button', { name: 'Send verification code' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /resend in/i })).not.toBeInTheDocument()

    await sendCode(user)
    expect(await screen.findByText('Delete code sent again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend in 7s' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Resend in 40s' })).not.toBeInTheDocument()
  })

  it('applies a new resend cooldown from the backend and stays on the code step if that send fails', async () => {
    requestDeleteTokenMock
      .mockResolvedValueOnce(successBody('Delete code sent.', 0))
      .mockResolvedValueOnce({
        isSuccess: false,
        code: 'RATE_LIMIT',
        message: 'Please wait before requesting another code.',
        data: { cd: 8 }
      })

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await sendCode(user)

    const input = await screen.findByRole('textbox', { name: 'Verification code' })
    await user.type(input, 'AbC123')
    await user.click(screen.getByRole('button', { name: 'Resend' }))

    expect(await screen.findByText('Please wait before requesting another code.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend in 8s' })).toBeDisabled()
    expect(input).toHaveValue('AbC123')
    expect(screen.queryByText('Verify your email first in the Email section on this page.')).not.toBeInTheDocument()
    expect(requestDeleteTokenMock).toHaveBeenCalledTimes(2)
    expect(deleteAccountMock).not.toHaveBeenCalled()
  })

  it('ignores a second send while the first request is still in flight', async () => {
    let resolveRequest: (value: ReturnType<typeof successBody>) => void = () => undefined
    requestDeleteTokenMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)

    const sendButton = screen.getByRole('button', { name: 'Send verification code' })
    await user.click(sendButton)
    await user.click(sendButton)

    expect(requestDeleteTokenMock).toHaveBeenCalledTimes(1)
    resolveRequest(successBody('Delete code sent.', 0))
    expect(await screen.findByText('Delete code sent.')).toBeInTheDocument()
  })

  it('disables the send button while a token request is pending', async () => {
    pendingState.isPendingRequestDeleteToken = true

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)

    expect(screen.getByRole('button', { name: /send verification code/i })).toBeDisabled()
  })

  it('drops a token response that arrives after the dialog is closed', async () => {
    let resolveRequest: (value: ReturnType<typeof successBody>) => void = () => undefined
    requestDeleteTokenMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )

    const user = setupUser()
    render(<DeleteAccountSection />)
    await openDialog(user)
    await user.click(screen.getByRole('button', { name: 'Send verification code' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    resolveRequest(successBody('Delete code sent.', 15))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await openDialog(user)

    expect(screen.getByRole('button', { name: 'Send verification code' })).toBeInTheDocument()
    expect(screen.queryByText('Delete code sent.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resend in 15s' })).not.toBeInTheDocument()
    expect(deleteAccountMock).not.toHaveBeenCalled()
  })
})
