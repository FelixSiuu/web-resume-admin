import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { avatarService } from '@/services/myInfo.service'

export default function useAvatarHooks() {
  const queryClient = useQueryClient()

  /**
   * 獲取頭像預覽
   */
  const {
    data: avatarBlob = null,
    isLoading: isAvatarLoading,
    refetch: refetchAvatar
  } = useQuery<Blob | null>({
    queryKey: ['getAvatar'],
    queryFn: async () => {
      try {
        const blob = await avatarService.getAvatar()
        if (!blob || blob.size === 0) return null
        return blob
      } catch {
        return null
      }
    }
  })

  const avatarPreview = useMemo(() => {
    if (!avatarBlob) return null
    return URL.createObjectURL(avatarBlob)
  }, [avatarBlob])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  /**
   * 上傳頭像
   */
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useMutation({
    mutationFn: async (file: File) => {
      const { isSuccess, message } = await avatarService.uploadAvatar(file)
      if (!isSuccess) throw new Error(message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getAvatar'] })
    }
  })

  /**
   * 移除頭像
   */
  const { mutateAsync: removeAvatar, isPending: isRemovingAvatar } = useMutation({
    mutationFn: async () => {
      const { isSuccess, message } = await avatarService.deleteAvatar()
      if (!isSuccess) throw new Error(message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getAvatar'] })
    }
  })

  return {
    avatarPreview,
    isAvatarLoading,
    refetchAvatar,
    uploadAvatar,
    isUploadingAvatar,
    removeAvatar,
    isRemovingAvatar
  }
}
