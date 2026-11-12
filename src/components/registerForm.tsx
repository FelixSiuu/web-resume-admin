import { useRegisterMutation } from '@/hooks/useUserHooks'
import { RegisterDto } from '@/services/user.service'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Form, Input, Modal } from 'antd'
import React from 'react'

interface RegisterFormProps {
  open: boolean
  onCancel: () => void
  handleRegisterSuccess: (values: Values) => void
  handleRegisterError: (errorText: string) => void
}

interface Values {
  username: string
  password: string
}

const RegisterForm: React.FC<RegisterFormProps> = ({ open, onCancel, handleRegisterSuccess, handleRegisterError }) => {
  const [form] = Form.useForm()
  const { isPendingRegister, register } = useRegisterMutation()

  const onFinish = async (values: Values) => {
    try {
      const postBody: RegisterDto = {
        username: values.username,
        password: values.password
      }

      await register(postBody)

      handleRegisterSuccess(values)
    } catch (error) {
      if (error instanceof Error) {
        handleRegisterError(error.message)
      }
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Register!!"
      destroyOnHidden
      okText="Create"
      okButtonProps={{ htmlType: 'submit' }}
      cancelText="Cancel"
      confirmLoading={isPendingRegister}
      modalRender={(dom) => {
        return (
          <Form form={form} name="register" size="large" onFinish={onFinish} disabled={isPendingRegister} layout="vertical" autoComplete="off" clearOnDestroy>
            {dom}
          </Form>
        )
      }}
    >
      <Form.Item name="username" rules={[{ required: true, message: 'Please input your Username!' }]}>
        <Input prefix={<UserOutlined />} placeholder="Username" allowClear />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Please input your Password!' },
          {
            pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/,
            message: 'Password must be 8-20 characters and include letters and numbers'
          }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} type="password" placeholder="8-20 chars, letters and numbers" allowClear />
      </Form.Item>
    </Modal>
  )
}

export default RegisterForm
