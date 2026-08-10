'use client'

import { useState } from 'react'
import { LoadingOutlined, LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Checkbox, Flex, Form, Image, Input, message } from 'antd'
import useUserHooks from '@/hooks/useUserHooks'
import { LoginDto } from '@/services/user.service'
import Cookies from 'js-cookie'
import RegisterForm from '@/components/registerForm'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

const Login = () => {
  const [form] = Form.useForm()
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const [messageApi, contextHolder] = message.useMessage()
  const { captchaImgUrl, isFetchingCaptcha, isPendingLogin, login, refreshCaptcha } = useUserHooks()

  const [open, setOpen] = useState(false)

  const onFinish = async (values: UserInput) => {
    messageApi.open({
      type: 'loading',
      content: 'Submitting...',
      duration: 0
    })

    try {
      const postBody: LoginDto = {
        username: values.username,
        password: values.password,
        captcha: values.captcha
      }

      const data = await login(postBody)

      Cookies.set('token', data.token, { expires: 2 })
      setUser({ username: data.username })
      messageApi.destroy()

      router.push('/overview')
    } catch (error) {
      messageApi.destroy()
      if (error instanceof Error) {
        messageApi.open({ type: 'error', content: error.message })
      } else {
        messageApi.open({ type: 'error', content: 'Login failed, please try again.' })
      }
      refreshCaptcha()
    } finally {
      form.setFieldValue('captcha', '')
    }
  }

  const handleOpen = () => setOpen(true)

  const handleCancel = () => setOpen(false)

  const handleRegisterSuccess = (values: { username: string; password: string }) => {
    form.setFieldValue('username', values.username)
    form.setFieldValue('password', values.password)
    handleCancel()
  }

  const handleRegisterError = (errorText: string) => messageApi.open({ type: 'error', content: errorText })

  return (
    <main className="min-h-screen flex justify-center items-center">
      {contextHolder}

      <div className="w-full max-w-120 p-4">
        <Form form={form} name="login" initialValues={{ remember: true }} size="large" onFinish={onFinish} disabled={isPendingLogin} clearOnDestroy>
          <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" allowClear />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Please input your Password!' }]}>
            <Input.Password prefix={<LockOutlined />} type="password" placeholder="Password" allowClear />
          </Form.Item>

          <Form.Item name="captcha" rules={[{ required: true, message: 'Please input Captcha!' }]}>
            <Input prefix={<SafetyOutlined />} placeholder="Captcha" allowClear />
          </Form.Item>

          <Form.Item>
            <Flex justify="space-between" align="center">
              <Image src={captchaImgUrl} width={150} height={40} alt="captcha" placeholder={<LoadingOutlined />} />

              <Button htmlType="button" onClick={refreshCaptcha} disabled={isFetchingCaptcha}>
                refresh captcha
              </Button>
            </Flex>
          </Form.Item>

          <Form.Item>
            <Flex justify="space-between" align="center">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              {/* <a href="">Forgot password</a> */}
            </Flex>
          </Form.Item>

          <Form.Item>
            <Button block type="primary" htmlType="submit" disabled={isPendingLogin}>
              {isPendingLogin ? 'submitting...' : ' Log in'}
            </Button>
            or
            <Button type="link" htmlType="button" onClick={handleOpen}>
              Register now!
            </Button>
          </Form.Item>
        </Form>
      </div>

      <RegisterForm open={open} onCancel={handleCancel} handleRegisterSuccess={handleRegisterSuccess} handleRegisterError={handleRegisterError} />
    </main>
  )
}

export default Login
