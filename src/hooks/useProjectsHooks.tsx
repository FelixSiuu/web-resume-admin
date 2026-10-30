import { ProjectDto, projectService } from '@/services/myInfo.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const projectQueryKeys = {
  all: ['projects'] as const,
  list: () => [...projectQueryKeys.all, 'list'] as const,
  detail: (slug?: string) => [...projectQueryKeys.all, 'detail', slug] as const
}

export function useProjectListQuery() {
  const { data: list = [], isLoading: isLoadingList } = useQuery({
    queryKey: projectQueryKeys.list(),
    queryFn: async () => {
      const { isSuccess, data, message } = await projectService.getProjectList()
      if (!isSuccess) throw new Error(message)
      return data
    }
  })

  return {
    list,
    isLoadingList
  }
}

export function useProjectDetailQuery(slug?: string) {
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: projectQueryKeys.detail(slug),
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) throw new Error('Project slug is required')

      const { isSuccess, data, message } = await projectService.getProjectDetail(slug)
      if (!isSuccess) throw new Error(message)
      return data
    }
  })

  return {
    detail,
    isLoadingDetail
  }
}

export function useProjectMutations() {
  const queryClient = useQueryClient()

  const { mutateAsync: addProject, isPending: isAddLoading } = useMutation({
    mutationFn: async (postBody: ProjectDto) => {
      const { isSuccess, message } = await projectService.addProject(postBody)
      if (!isSuccess) throw new Error(message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() })
    }
  })

  const { mutateAsync: editProject, isPending: isEditLoading } = useMutation({
    mutationFn: async ({ slug, postBody }: { slug: string; postBody: ProjectDto }) => {
      const { isSuccess, message } = await projectService.editProject(slug, postBody)
      if (!isSuccess) throw new Error(message)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(variables.slug) })
    }
  })

  const { mutateAsync: deleteProject, isPending: isDeleteLoading } = useMutation({
    mutationFn: async (slug: string) => {
      const { isSuccess, message } = await projectService.deleteProject(slug)
      if (!isSuccess) throw new Error(message)
    },
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() })
      queryClient.removeQueries({ queryKey: projectQueryKeys.detail(slug) })
    }
  })

  const confirmLoading = isAddLoading || isEditLoading || isDeleteLoading

  return {
    isDeleteLoading,
    addProject,
    editProject,
    deleteProject,
    confirmLoading
  }
}
