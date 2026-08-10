import { ContactDto, contactService } from '@/services/myInfo.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function useContactHooks() {
  const queryClient = useQueryClient()

  /**
   * 獲取數據
   */
  const { data, isLoading } = useQuery<Contact>({
    queryKey: ['getContact'],
    queryFn: async () => {
      const { isSuccess, data, message } = await contactService.getContact()
      if (!isSuccess) throw new Error(message)
      return data
    }
  })

  /**
   * 更新數據
   */
  const { mutateAsync: updateContact, isPending: isUpdateLoading } = useMutation({
    mutationFn: async (postBody: ContactDto) => {
      const { isSuccess, message } = await contactService.updateContact(postBody)
      if (!isSuccess) throw new Error(message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getContact'] })
    }
  })

  return {
    data,
    isLoading,
    updateContact,
    isUpdateLoading
  }
}
