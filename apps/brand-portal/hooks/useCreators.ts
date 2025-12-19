import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

export function useCreators(filters?: any) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['creators', filters],
    queryFn: async () => {
      const response = await apiClient.creators.getAll(filters)
      return response.data
    },
  })

  return {
    creators: data || [],
    isLoading,
    error,
  }
}

export function useCreator(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['creator', id],
    queryFn: async () => {
      const response = await apiClient.creators.getById(id)
      return response.data
    },
    enabled: !!id,
  })

  return {
    creator: data,
    isLoading,
    error,
  }
}

export function useInviteCreator() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ creatorId, campaignId }: { creatorId: string; campaignId: string }) =>
      apiClient.creators.invite(creatorId, campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Invitation sent successfully!')
    },
    onError: () => {
      toast.error('Failed to send invitation')
    },
  })

  return mutation.mutate
}
