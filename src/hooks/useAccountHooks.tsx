import { ChangePasswordDto, accountService } from '@/services/account.service'
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
