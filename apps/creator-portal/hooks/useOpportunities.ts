import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { authUtils } from '@/lib/auth';

export function useOpportunities(filters?: any) {
  const token = authUtils.getAccessToken();

  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      return apiClient.getOpportunities(token, filters);
    },
    enabled: !!token,
  });
}

export function useOpportunity(id: string) {
  const token = authUtils.getAccessToken();

  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      return apiClient.getOpportunity(token, id);
    },
    enabled: !!token && !!id,
  });
}

export function useApplyToOpportunity() {
  const queryClient = useQueryClient();
  const token = authUtils.getAccessToken();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      if (!token) throw new Error('Not authenticated');
      return apiClient.applyToOpportunity(token, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useCampaigns(status?: string) {
  const token = authUtils.getAccessToken();

  return useQuery({
    queryKey: ['campaigns', status],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      return apiClient.getCampaigns(token, status);
    },
    enabled: !!token,
  });
}

export function useCampaign(id: string) {
  const token = authUtils.getAccessToken();

  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!token) throw new Error('Not authenticated');
      return apiClient.getCampaign(token, id);
    },
    enabled: !!token && !!id,
  });
}
