import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './page'

const { pushMock, setUserMock, setXsrfTokenMock, loginMock, refreshCaptchaMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  setUserMock: vi.fn(),
  setXsrfTokenMock: vi.fn(),
  loginMock: vi.fn(),
  refreshCaptchaMock: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (
    selector: (state: { setUser: typeof setUserMock; setXsrfToken: typeof setXsrfTokenMock }) => unknown
  ) =>
    selector({
      setUser: setUserMock,
      setXsrfToken: setXsrfTokenMock
    })
}))

vi.mock('@/hooks/useUserHooks', () => ({
  useCaptchaQuery: () => ({
    captchaImgUrl: '/captcha.png',
    isFetchingCaptcha: false,
    refreshCaptcha: refreshCaptchaMock
  }),
  useLoginMutation: () => ({
    login: loginMock,
    isPendingLogin: false
  })
}))

vi.mock('@/components/registerForm', () => ({
  default: () => null
}))

describe('Login page', () => {
  beforeEach(() => {
    pushMock.mockClear()
    setUserMock.mockClear()
    setXsrfTokenMock.mockClear()
    loginMock.mockClear()
    refreshCaptchaMock.mockClear()
  })

  it('submits login successfully and stores xsrf token', async () => {
    loginMock.mockResolvedValueOnce({
      username: 'felix',
      xsrfToken: 'csrf-from-login'
    })

    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByPlaceholderText('Username'), 'felix')
    await user.type(screen.getByPlaceholderText('Password'), '123456')
    await user.type(screen.getByPlaceholderText('Captcha'), 'abcd')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        username: 'felix',
        password: '123456',
        captcha: 'abcd'
      })
    })

    expect(setUserMock).toHaveBeenCalledWith({ username: 'felix' })
    expect(setXsrfTokenMock).toHaveBeenCalledWith('csrf-from-login')
    expect(pushMock).toHaveBeenCalledWith('/overview/aboutme')
  })

  it('refreshes captcha and clears captcha input on failed login', async () => {
    loginMock.mockRejectedValueOnce(new Error('login failed'))

    const user = userEvent.setup()
    render(<Login />)

    await user.type(screen.getByPlaceholderText('Username'), 'felix')
    await user.type(screen.getByPlaceholderText('Password'), '123456')
    await user.type(screen.getByPlaceholderText('Captcha'), 'abcd')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(refreshCaptchaMock).toHaveBeenCalledTimes(1)
    })

    expect(pushMock).not.toHaveBeenCalled()
    expect(setXsrfTokenMock).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
  })
})
