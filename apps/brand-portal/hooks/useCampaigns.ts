import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { toast } from 'sonner'

export function useCampaigns() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await apiClient.campaigns.getAll()
      return response.data
    },
  })

  const createCampaign = useMutation({
    mutationFn: (campaignData: any) => apiClient.campaigns.create(campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign created successfully!')
    },
    onError: () => {
      toast.error('Failed to create campaign')
    },
  })

  const updateCampaign = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.campaigns.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign updated successfully!')
    },
    onError: () => {
      toast.error('Failed to update campaign')
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: (id: string) => apiClient.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign deleted successfully!')
    },
    onError: () => {
      toast.error('Failed to delete campaign')
    },
  })

  return {
    campaigns: data || [],
    isLoading,
    error,
    createCampaign: createCampaign.mutate,
    updateCampaign: updateCampaign.mutate,
    deleteCampaign: deleteCampaign.mutate,
  }
}

export function useCampaign(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const response = await apiClient.campaigns.getById(id)
      return response.data
    },
    enabled: !!id,
  })

  return {
    campaign: data,
    isLoading,
    error,
  }
}
