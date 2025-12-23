import { create } from 'zustand';
import { apiClient, Content, Earning, Payout } from '../services/api';

interface ContentState {
  // Content Library
  content: Content[];
  contentLoading: boolean;
  contentError: string | null;

  // Upload state
  uploadProgress: number;
  isUploading: boolean;

  // Earnings
  earnings: Earning[];
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  earningsLoading: boolean;

  // Payouts
  payouts: Payout[];
  payoutsLoading: boolean;

  // Actions
  fetchContent: () => Promise<void>;
  uploadContent: (formData: FormData) => Promise<Content>;
  deleteContent: (id: string) => Promise<void>;
  fetchEarnings: () => Promise<void>;
  fetchPayouts: () => Promise<void>;
  requestPayout: (amount: number, method: 'paypal' | 'bank_transfer' | 'venmo') => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  content: [],
  contentLoading: false,
  contentError: null,

  uploadProgress: 0,
  isUploading: false,

  earnings: [],
  totalEarnings: 0,
  availableBalance: 0,
  pendingBalance: 0,
  earningsLoading: false,

  payouts: [],
  payoutsLoading: false,

  fetchContent: async () => {
    set({ contentLoading: true, contentError: null });
    try {
      const response = await apiClient.getMyContent();
      set({ content: response.content, contentLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch content';
      set({ contentError: message, contentLoading: false });
    }
  },

  uploadContent: async (formData: FormData) => {
    set({ isUploading: true, uploadProgress: 0 });
    try {
      const content = await apiClient.uploadContent(formData);
      set((state) => ({
        content: [content, ...state.content],
        isUploading: false,
        uploadProgress: 100,
      }));
      return content;
    } catch (error) {
      set({ isUploading: false, uploadProgress: 0 });
      throw error;
    }
  },

  deleteContent: async (id: string) => {
    try {
      await apiClient.deleteContent(id);
      set((state) => ({
        content: state.content.filter((c) => c.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  fetchEarnings: async () => {
    set({ earningsLoading: true });
    try {
      const response = await apiClient.getEarnings();
      set({
        earnings: response.earnings,
        totalEarnings: response.totalEarnings,
        availableBalance: response.availableBalance,
        pendingBalance: response.pendingBalance,
        earningsLoading: false,
      });
    } catch (error) {
      set({ earningsLoading: false });
    }
  },

  fetchPayouts: async () => {
    set({ payoutsLoading: true });
    try {
      const response = await apiClient.getPayouts();
      set({ payouts: response.payouts, payoutsLoading: false });
    } catch (error) {
      set({ payoutsLoading: false });
    }
  },

  requestPayout: async (amount: number, method: 'paypal' | 'bank_transfer' | 'venmo') => {
    try {
      const payout = await apiClient.requestPayout({ amount, method });
      set((state) => ({
        payouts: [payout, ...state.payouts],
        availableBalance: state.availableBalance - amount,
        pendingBalance: state.pendingBalance + amount,
      }));
    } catch (error) {
      throw error;
    }
  },
}));
