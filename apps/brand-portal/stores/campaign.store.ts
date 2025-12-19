import { create } from 'zustand'

export type Campaign = {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  startDate: string
  endDate: string
  budget: number
  spent: number
  objectives: string[]
  platforms: string[]
  createdAt: string
  updatedAt: string
}

type CampaignStore = {
  campaigns: Campaign[]
  selectedCampaign: Campaign | null
  isLoading: boolean
  error: string | null

  // Actions
  setCampaigns: (campaigns: Campaign[]) => void
  addCampaign: (campaign: Campaign) => void
  updateCampaign: (id: string, updates: Partial<Campaign>) => void
  deleteCampaign: (id: string) => void
  selectCampaign: (campaign: Campaign | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCampaignStore = create<CampaignStore>((set) => ({
  campaigns: [],
  selectedCampaign: null,
  isLoading: false,
  error: null,

  setCampaigns: (campaigns) => set({ campaigns }),

  addCampaign: (campaign) =>
    set((state) => ({ campaigns: [...state.campaigns, campaign] })),

  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      selectedCampaign:
        state.selectedCampaign?.id === id
          ? { ...state.selectedCampaign, ...updates }
          : state.selectedCampaign,
    })),

  deleteCampaign: (id) =>
    set((state) => ({
      campaigns: state.campaigns.filter((c) => c.id !== id),
      selectedCampaign:
        state.selectedCampaign?.id === id ? null : state.selectedCampaign,
    })),

  selectCampaign: (campaign) => set({ selectedCampaign: campaign }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}))
