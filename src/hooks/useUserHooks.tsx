import { ChangePasswordDto, LoginDto, RegisterDto, userService } from '@/services/user.service'
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

export function useChangePasswordMutation() {
  const { mutateAsync: changePassword, isPending: isPendingChangePassword } = useMutation({
    mutationFn: async (postBody: ChangePasswordDto) => {
      const { isSuccess, message } = await userService.changePassword(postBody)
      if (!isSuccess) throw new Error(message)
    }
  })

  return {
    changePassword,
    isPendingChangePassword
  }
}

export function useDeleteAccountMutation() {
  const { mutateAsync: deleteAccount, isPending: isPendingDeleteAccount } = useMutation({
    mutationFn: async () => {
      const { isSuccess, message } = await userService.deleteAccount()
      if (!isSuccess) throw new Error(message)
    }
  })

  return {
    deleteAccount,
    isPendingDeleteAccount
  }
}
