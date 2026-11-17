import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    forgotPasswordMock.mockResolvedValueOnce('We sent a reset link to your inbox.')

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
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument()
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
