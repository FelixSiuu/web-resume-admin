import { BindEmailDto, BoundEmailVo, ChangePasswordDto, accountService } from '@/services/account.service'
import { handleUnauthorized } from '@/services/api'
import { useMutation } from '@tanstack/react-query'

export function useChangePasswordMutation() {
  const { mutateAsync: changePassword, isPending: isPendingChangePassword } = useMutation({
    mutationFn: async (postBody: ChangePasswordDto) => {
      const { isSuccess, message } = await accountService.changePassword(postBody)
      if (!isSuccess) throw new Error(message)
      handleUnauthorized()
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
      const { isSuccess, message } = await accountService.deleteAccount()
      if (!isSuccess) throw new Error(message)
      handleUnauthorized()
    }
  })

  return {
    deleteAccount,
    isPendingDeleteAccount
  }
}

export function useBindEmailMutation() {
  const { mutateAsync: bindEmail, isPending: isPendingBindEmail } = useMutation({
    mutationFn: async (postBody: BindEmailDto): Promise<BoundEmailVo> => {
      const { isSuccess, message, data } = await accountService.bindEmail(postBody)
      if (!isSuccess || !data) throw new Error(message)
      return data
    }
  })

  return {
    bindEmail,
    isPendingBindEmail
  }
}
