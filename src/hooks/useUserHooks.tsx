import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyEmailDto, userService } from '@/services/user.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const userQueryKeys = {
  captcha: ['getCaptcha'] as const
}

export function useCaptchaQuery() {
  const queryClient = useQueryClient()

  const { data: captchaImgUrl = '', isFetching: isFetchingCaptcha } = useQuery({
    queryKey: userQueryKeys.captcha,
    queryFn: async () => {
      const { isSuccess, data, message } = await userService.getCaptcha()
      if (!isSuccess) throw new Error(message)
      return data
    }
  })

  const refreshCaptcha = () =>
    queryClient.invalidateQueries({
      queryKey: userQueryKeys.captcha
    })

  return {
    captchaImgUrl,
    isFetchingCaptcha,
    refreshCaptcha
  }
}

export function useLoginMutation() {
  const { mutateAsync: login, isPending: isPendingLogin } = useMutation({
    mutationFn: async (postBody: LoginDto) => {
      const { isSuccess, data, message } = await userService.login(postBody)
      if (!isSuccess) throw new Error(message)
      return data
    }
  })

  return {
    login,
    isPendingLogin
  }
}

export function useRegisterMutation() {
  const { mutateAsync: register, isPending: isPendingRegister } = useMutation({
    mutationFn: async (postBody: RegisterDto) => {
      const { isSuccess, message } = await userService.register(postBody)
      if (!isSuccess) throw new Error(message)
    }
  })

  return {
    register,
    isPendingRegister
  }
}

export function useVerifyEmailMutation() {
  const { mutateAsync: verifyEmail, isPending: isPendingVerifyEmail } = useMutation({
    mutationFn: async (postBody: VerifyEmailDto) => {
      const { isSuccess, message } = await userService.verifyEmail(postBody)
      if (!isSuccess) throw new Error(message)
    }
  })

  return {
    verifyEmail,
    isPendingVerifyEmail
  }
}

export function useForgotPasswordMutation() {
  const { mutateAsync: forgotPassword, isPending: isPendingForgotPassword } = useMutation({
    mutationFn: async (postBody: ForgotPasswordDto) => {
      const { isSuccess, message } = await userService.forgotPassword(postBody)
      if (!isSuccess) throw new Error(message)
      return message
    }
  })

  return {
    forgotPassword,
    isPendingForgotPassword
  }
}

export function useResetPasswordMutation() {
  const { mutateAsync: resetPassword, isPending: isPendingResetPassword } = useMutation({
    mutationFn: async (postBody: ResetPasswordDto) => {
      const { isSuccess, message } = await userService.resetPassword(postBody)
      if (!isSuccess) throw new Error(message)
      return message
    }
  })

  return {
    resetPassword,
    isPendingResetPassword
  }
}
