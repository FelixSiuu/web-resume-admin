import { ChangePasswordDto, EmailDto, EmailVo, accountService } from '@/services/account.service'
import { handleUnauthorized } from '@/services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const accountEmailQueryKey = ['getAccountEmail'] as const

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

export function useEmailQuery() {
  const { data, isLoading: isLoadingEmail } = useQuery<EmailVo>({
    queryKey: accountEmailQueryKey,
    queryFn: async () => {
      const { isSuccess, message, data } = await accountService.getEmail()
      if (!isSuccess || !data) throw new Error(message)
      return data
    }
  })

  return {
    emailStatus: data,
    isLoadingEmail
  }
}

export function useUpdateEmailMutation() {
  const queryClient = useQueryClient()
  const { mutateAsync: updateEmail, isPending: isPendingUpdateEmail } = useMutation({
    mutationFn: async (postBody: EmailDto): Promise<EmailVo> => {
      const { isSuccess, message, data } = await accountService.updateEmail(postBody)
      if (!isSuccess || !data) throw new Error(message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountEmailQueryKey })
    }
  })

  return {
    updateEmail,
    isPendingUpdateEmail
  }
}
