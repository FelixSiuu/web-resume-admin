import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResetPasswordPage from './page'

const { resetPasswordMock, validateResetTokenMock, searchParamsRef, pendingState } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
  validateResetTokenMock: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
  pendingState: { isPendingResetPassword: false }
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParamsRef.current
}))

vi.mock('@/hooks/useUserHooks', () => ({
  useResetPasswordMutation: () => ({
    resetPassword: resetPasswordMock,
    isPendingResetPassword: pendingState.isPendingResetPassword
  }),
  useValidateResetTokenMutation: () => ({
    validateResetToken: validateResetTokenMock,
    isPendingValidateResetToken: false
  })
}))

describe('Reset password page', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset()
    validateResetTokenMock.mockReset()
    validateResetTokenMock.mockResolvedValue('Reset link is valid.')
    pendingState.isPendingResetPassword = false
    searchParamsRef.current = new URLSearchParams()
  })

  it('warns when the token is missing and links to a new request', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByText('Missing reset token')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByPlaceholderText('New password')).not.toBeInTheDocument()
    expect(screen.queryByText('Checking reset link...')).not.toBeInTheDocument()
    expect(validateResetTokenMock).not.toHaveBeenCalled()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('treats a blank token as missing', () => {
    searchParamsRef.current = new URLSearchParams('token=%20%20')
    render(<ResetPasswordPage />)

    expect(screen.getByText('Missing reset token')).toBeInTheDocument()
    expect(validateResetTokenMock).not.toHaveBeenCalled()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('checks the token on entry and shows the form only after it is valid', async () => {
    let resolveValidate: (message: string) => void = () => undefined
    validateResetTokenMock.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveValidate = resolve
      })
    )
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    render(<ResetPasswordPage />)

    expect(screen.getByText('Checking reset link...')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('New password')).not.toBeInTheDocument()
    expect(validateResetTokenMock).toHaveBeenCalledWith({ token: 'reset-token' })

    resolveValidate('Reset link is valid.')

    expect(await screen.findByPlaceholderText('New password')).toBeInTheDocument()
    expect(screen.queryByText('Reset link is valid.')).not.toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('shows the API message and a new-link action when the token is invalid', async () => {
    searchParamsRef.current = new URLSearchParams('token=expired-token')
    validateResetTokenMock.mockRejectedValueOnce(new Error('Reset link is invalid or has expired.'))
    render(<ResetPasswordPage />)

    expect(await screen.findByText('Reset link is invalid or has expired.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('New password')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Confirm new password')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a password that does not match the register rule', async () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    expect(await screen.findByPlaceholderText('New password')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Captcha')).not.toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('New password'), 'abcdefgh')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'abcdefgh')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('Password must be 8-20 characters and include letters and numbers')).toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('requires the confirmation password to match', async () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    await user.type(await screen.findByPlaceholderText('New password'), 'abc12345')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'abc12346')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('The two passwords do not match!')).toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('resets the password and shows the backend message', async () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    resetPasswordMock.mockResolvedValueOnce('Your password has been updated.')

    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    await user.type(await screen.findByPlaceholderText('New password'), 'abc12345')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'abc12345')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        token: 'reset-token',
        password: 'abc12345'
      })
    })

    expect(await screen.findByText('Password reset')).toBeInTheDocument()
    expect(screen.getByText('Your password has been updated.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('shows an invalid token error and a way to request a new link', async () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    resetPasswordMock.mockRejectedValueOnce(new Error('Reset link is invalid or has expired.'))

    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    await user.type(await screen.findByPlaceholderText('New password'), 'abc12345')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'abc12345')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('Password reset failed')).toBeInTheDocument()
    expect(screen.getByText('Reset link is invalid or has expired.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('disables the form while the request is pending', async () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    pendingState.isPendingResetPassword = true
    render(<ResetPasswordPage />)

    expect(await screen.findByPlaceholderText('New password')).toBeDisabled()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeDisabled()
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
  })
})
