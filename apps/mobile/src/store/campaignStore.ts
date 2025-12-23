import { create } from 'zustand';
import { apiClient, Campaign } from '../services/api';

interface CampaignFilters {
  category?: string;
  search?: string;
  minReward?: number;
}

interface CampaignState {
  // Opportunities (available campaigns)
  opportunities: Campaign[];
  opportunitiesLoading: boolean;
  opportunitiesError: string | null;

  // My Campaigns (applied/active)
  myCampaigns: Campaign[];
  myCampaignsLoading: boolean;
  myCampaignsError: string | null;

  // Selected Campaign
  selectedCampaign: Campaign | null;
  selectedCampaignLoading: boolean;

  // Filters
  filters: CampaignFilters;

  // Actions
  fetchOpportunities: (filters?: CampaignFilters) => Promise<void>;
  fetchMyCampaigns: (status?: 'active' | 'completed' | 'pending') => Promise<void>;
  fetchCampaign: (id: string) => Promise<void>;
  applyToCampaign: (id: string, pitch: string) => Promise<void>;
  setFilters: (filters: CampaignFilters) => void;
  clearSelectedCampaign: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  opportunities: [],
  opportunitiesLoading: false,
  opportunitiesError: null,

  myCampaigns: [],
  myCampaignsLoading: false,
  myCampaignsError: null,

  selectedCampaign: null,
  selectedCampaignLoading: false,

  filters: {},

  fetchOpportunities: async (filters?: CampaignFilters) => {
    set({ opportunitiesLoading: true, opportunitiesError: null });
    try {
      const appliedFilters = filters || get().filters;
      const response = await apiClient.getOpportunities(appliedFilters);
      set({ opportunities: response.opportunities, opportunitiesLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch opportunities';
      set({ opportunitiesError: message, opportunitiesLoading: false });
    }
  },

  fetchMyCampaigns: async (status?: 'active' | 'completed' | 'pending') => {
    set({ myCampaignsLoading: true, myCampaignsError: null });
    try {
      const response = await apiClient.getMyCampaigns(status);
      set({ myCampaigns: response.campaigns, myCampaignsLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      set({ myCampaignsError: message, myCampaignsLoading: false });
    }
  },

  fetchCampaign: async (id: string) => {
    set({ selectedCampaignLoading: true });
    try {
      const campaign = await apiClient.getCampaign(id);
      set({ selectedCampaign: campaign, selectedCampaignLoading: false });
    } catch (error) {
      set({ selectedCampaignLoading: false });
      throw error;
    }
  },

  applyToCampaign: async (id: string, pitch: string) => {
    try {
      await apiClient.applyToOpportunity(id, { pitch });
      // Refresh opportunities after applying
      get().fetchOpportunities();
    } catch (error) {
      throw error;
    }
  },

  setFilters: (filters: CampaignFilters) => {
    set({ filters });
    get().fetchOpportunities(filters);
  },

  clearSelectedCampaign: () => set({ selectedCampaign: null }),
}));
