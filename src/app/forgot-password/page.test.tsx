import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordError } from '@/services/user.service'
import ForgotPassword from './page'

const { forgotPasswordMock, refreshCaptchaMock, pendingState } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
  refreshCaptchaMock: vi.fn(),
  pendingState: { isPendingForgotPassword: false }
}))

vi.mock('@/hooks/useUserHooks', () => ({
  useCaptchaQuery: () => ({
    captchaImgUrl: '/captcha.png',
    isFetchingCaptcha: false,
    refreshCaptcha: refreshCaptchaMock
  }),
  useForgotPasswordMutation: () => ({
    forgotPassword: forgotPasswordMock,
    isPendingForgotPassword: pendingState.isPendingForgotPassword
  })
}))

const fillForm = async (user: ReturnType<typeof userEvent.setup>, email: string, captcha: string) => {
  await user.type(screen.getByPlaceholderText('Email'), email)
  await user.type(screen.getByPlaceholderText('Captcha'), captcha)
}

describe('Forgot password page', () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset()
    refreshCaptchaMock.mockReset()
    pendingState.isPendingForgotPassword = false
  })

  it('sends a reset link and shows the backend message', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      message: 'We sent a reset link to your inbox.',
      cd: 0
    })

    const user = userEvent.setup()
    render(<ForgotPassword />)

    await fillForm(user, '  user@example.com  ', 'abcd')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        captcha: 'abcd'
      })
    })

    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText('We sent a reset link to your inbox.')).toBeInTheDocument()
    expect(screen.queryByText(/if this email is registered, you will receive a reset link shortly/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend' })).toBeEnabled()
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument()
  })

  it('returns to the form with the same email and a refreshed captcha when Resend is clicked', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      message: 'We sent a reset link to your inbox.',
      cd: 0
    })

    const user = userEvent.setup()
    render(<ForgotPassword />)

    await fillForm(user, 'user@example.com', 'abcd')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await user.click(await screen.findByRole('button', { name: 'Resend' }))

    expect(forgotPasswordMock).toHaveBeenCalledTimes(1)
    expect(refreshCaptchaMock).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com')
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled()
  })

  it('disables resend until the cooldown from a successful response ends', async () => {
    forgotPasswordMock.mockResolvedValueOnce({
      message: 'We sent a reset link to your inbox.',
      cd: 1
    })

    const user = userEvent.setup()
    render(<ForgotPassword />)

    await fillForm(user, 'user@example.com', 'abcd')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByRole('button', { name: 'Resend in 1s' })).toBeDisabled()
    expect(screen.getByText('We sent a reset link to your inbox.')).toBeInTheDocument()

    const resend = await screen.findByRole('button', { name: 'Resend' }, { timeout: 2000 })
    expect(resend).toBeEnabled()
    await user.click(resend)

    expect(forgotPasswordMock).toHaveBeenCalledTimes(1)
    expect(refreshCaptchaMock).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com')
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
  })

  it('shows the API error, refreshes captcha, and clears the captcha field', async () => {
    forgotPasswordMock.mockRejectedValueOnce(new Error('Too many reset attempts. Please try again later.'))

    const user = userEvent.setup()
    render(<ForgotPassword />)

    await fillForm(user, 'user@example.com', 'abcd')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('Too many reset attempts. Please try again later.')).toBeInTheDocument()
    expect(refreshCaptchaMock).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
    expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com')
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
  })

  it('disables submit for the cooldown on a failed response', async () => {
    forgotPasswordMock.mockRejectedValueOnce(
      new ForgotPasswordError('Please wait before requesting another link.', 45)
    )

    const user = userEvent.setup()
    render(<ForgotPassword />)

    await fillForm(user, 'user@example.com', 'abcd')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('Please wait before requesting another link.')).toBeInTheDocument()
    expect(refreshCaptchaMock).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
    expect(screen.getByPlaceholderText('Email')).toHaveValue('user@example.com')
    expect(screen.getByPlaceholderText('Email')).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Resend in 45s' })).toBeDisabled()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
  })

  it('does not submit an invalid email', async () => {
    const user = userEvent.setup()
    render(<ForgotPassword />)

    await fillForm(user, 'not-an-email', 'abcd')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByText('Please input a valid email!')).toBeInTheDocument()
    expect(forgotPasswordMock).not.toHaveBeenCalled()
  })

  it('links back to login and shows the captcha image', () => {
    render(<ForgotPassword />)

    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('img', { name: 'captcha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh captcha/i })).toBeInTheDocument()
  })

  it('disables the form while the request is pending', () => {
    pendingState.isPendingForgotPassword = true
    render(<ForgotPassword />)

    expect(screen.getByPlaceholderText('Email')).toBeDisabled()
    expect(screen.getByPlaceholderText('Captcha')).toBeDisabled()
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
  })
})
