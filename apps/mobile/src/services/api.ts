import Constants from 'expo-constants';
import * as storage from './storage';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  niche: string;
  bio?: string;
  socialAccounts?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
  };
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  brandLogo?: string;
  category: string;
  description: string;
  reward: number;
  deadline: string;
  slots: number;
  filledSlots: number;
  requirements: string[];
  deliverables: Deliverable[];
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  image?: string;
}

export interface Deliverable {
  id: string;
  type: 'photo' | 'video' | 'story' | 'reel' | 'post';
  quantity: number;
  description: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
}

export interface Content {
  id: string;
  type: 'photo' | 'video';
  uri: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  campaignId?: string;
  campaignName?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Earning {
  id: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  status: 'pending' | 'available' | 'paid';
  earnedAt: string;
  paidAt?: string;
}

export interface Payout {
  id: string;
  amount: number;
  method: 'paypal' | 'bank_transfer' | 'venmo';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authToken = token || (await storage.getAccessToken());
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            const newToken = await storage.getAccessToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
              ...fetchOptions,
              headers,
            });
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
          await storage.clearAuth();
          throw new Error('Session expired. Please login again.');
        }

        const error = await response.json().catch(() => ({
          message: 'An error occurred',
        }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await storage.setTokens(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await storage.setTokens(response.accessToken, response.refreshToken);
    await storage.setUser(response.user);
    return response;
  }

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    niche: string;
    socialHandle: string;
    platform: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await storage.setTokens(response.accessToken, response.refreshToken);
    await storage.setUser(response.user);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      await storage.clearAuth();
    }
  }

  async getProfile(): Promise<User> {
    return this.request('/creators/profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request('/creators/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
    const token = await storage.getAccessToken();
    const response = await fetch(`${this.baseUrl}/creators/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }
    return response.json();
  }

  async getOpportunities(filters?: {
    category?: string;
    minReward?: number;
    search?: string;
  }): Promise<{ opportunities: Campaign[] }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minReward) params.append('minReward', String(filters.minReward));
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params}` : '';
    return this.request(`/opportunities${query}`);
  }

  async getOpportunity(id: string): Promise<Campaign> {
    return this.request(`/opportunities/${id}`);
  }

  async applyToOpportunity(
    id: string,
    data: {
      pitch: string;
      proposedRate?: number;
      portfolioLinks?: string[];
    }
  ): Promise<{ applicationId: string }> {
    return this.request(`/opportunities/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyCampaigns(status?: 'active' | 'completed' | 'pending'): Promise<{ campaigns: Campaign[] }> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/creators/campaigns${query}`);
  }

  async getCampaign(id: string): Promise<Campaign> {
    return this.request(`/creators/campaigns/${id}`);
  }

  async submitDeliverable(
    campaignId: string,
    deliverableId: string,
    data: { contentUrl: string; notes?: string }
  ): Promise<{ success: boolean }> {
    return this.request(`/creators/campaigns/${campaignId}/deliverables/${deliverableId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyContent(): Promise<{ content: Content[] }> {
    return this.request('/creators/content');
  }

  async uploadContent(formData: FormData): Promise<Content> {
    const token = await storage.getAccessToken();
    const response = await fetch(`${this.baseUrl}/creators/content`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload content');
    }
    return response.json();
  }

  async deleteContent(id: string): Promise<void> {
    await this.request(`/creators/content/${id}`, { method: 'DELETE' });
  }

  async getEarnings(): Promise<{
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    earnings: Earning[];
  }> {
    return this.request('/creators/earnings');
  }

  async getPayouts(): Promise<{ payouts: Payout[] }> {
    return this.request('/creators/payouts');
  }

  async requestPayout(data: { amount: number; method: 'paypal' | 'bank_transfer' | 'venmo' }): Promise<Payout> {
    return this.request('/creators/payouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayoutMethods(): Promise<{
    methods: {
      id: string;
      type: 'paypal' | 'bank_transfer' | 'venmo';
      details: string;
      isDefault: boolean;
    }[];
  }> {
    return this.request('/creators/payout-methods');
  }

  async getAnalytics(period?: '7d' | '30d' | '90d' | '1y'): Promise<{
    views: number;
    engagement: number;
    earnings: number;
    chartData: { date: string; value: number }[];
  }> {
    const query = period ? `?period=${period}` : '';
    return this.request(`/creators/analytics${query}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
