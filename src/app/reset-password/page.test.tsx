import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResetPasswordPage from './page'

const { resetPasswordMock, searchParamsRef, pendingState } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
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
  })
}))

describe('Reset password page', () => {
  beforeEach(() => {
    resetPasswordMock.mockReset()
    pendingState.isPendingResetPassword = false
    searchParamsRef.current = new URLSearchParams()
  })

  it('warns when the token is missing and links to a new request', () => {
    render(<ResetPasswordPage />)

    expect(screen.getByText('Missing reset token')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByPlaceholderText('New password')).not.toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('treats a blank token as missing', () => {
    searchParamsRef.current = new URLSearchParams('token=%20%20')
    render(<ResetPasswordPage />)

    expect(screen.getByText('Missing reset token')).toBeInTheDocument()
    expect(resetPasswordMock).not.toHaveBeenCalled()
  })

  it('rejects a password that does not match the register rule', async () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

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

    await user.type(screen.getByPlaceholderText('New password'), 'abc12345')
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

    await user.type(screen.getByPlaceholderText('New password'), 'abc12345')
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
    searchParamsRef.current = new URLSearchParams('token=expired-token')
    resetPasswordMock.mockRejectedValueOnce(new Error('Reset link is invalid or has expired.'))

    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    await user.type(screen.getByPlaceholderText('New password'), 'abc12345')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'abc12345')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText('Password reset failed')).toBeInTheDocument()
    expect(screen.getByText('Reset link is invalid or has expired.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /request a new link/i })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
  })

  it('disables the form while the request is pending', () => {
    searchParamsRef.current = new URLSearchParams('token=reset-token')
    pendingState.isPendingResetPassword = true
    render(<ResetPasswordPage />)

    expect(screen.getByPlaceholderText('New password')).toBeDisabled()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeDisabled()
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
  })
})
