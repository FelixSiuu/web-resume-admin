import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Login from './page'

const { pushMock, setUserMock, loginMock, refreshCaptchaMock, cookieSetMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  setUserMock: vi.fn(),
  loginMock: vi.fn(),
  refreshCaptchaMock: vi.fn(),
  cookieSetMock: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}))

vi.mock('js-cookie', () => ({
  default: {
    set: cookieSetMock
  }
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { setUser: typeof setUserMock }) => unknown) =>
    selector({
      setUser: setUserMock
    })
}))

vi.mock('@/hooks/useUserHooks', () => ({
  default: () => ({
    captchaImgUrl: '/captcha.png',
    isFetchingCaptcha: false,
    isPendingLogin: false,
    isPendingRegister: false,
    login: loginMock,
    register: vi.fn(),
    refreshCaptcha: refreshCaptchaMock
  })
}))

vi.mock('@/components/registerForm', () => ({
  default: () => null
}))

describe('Login page', () => {
  beforeEach(() => {
    pushMock.mockClear()
    setUserMock.mockClear()
    loginMock.mockClear()
    refreshCaptchaMock.mockClear()
    cookieSetMock.mockClear()
  })

  it('submits login successfully and navigates to overview', async () => {
    loginMock.mockResolvedValueOnce({
      token: 'mock-token',
      username: 'felix'
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

    expect(cookieSetMock).toHaveBeenCalledWith('token', 'mock-token', { expires: 2 })
    expect(setUserMock).toHaveBeenCalledWith({ username: 'felix' })
    expect(pushMock).toHaveBeenCalledWith('/overview')
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

    expect(cookieSetMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('Captcha')).toHaveValue('')
  })
})
