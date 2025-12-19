const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers as HeadersInit),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    fullName: string;
    email: string;
    password: string;
    niche: string;
    socialHandle: string;
    platform: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(token: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      token,
    });
  }

  // Profile
  async getProfile(token: string) {
    return this.request('/creators/profile', { token });
  }

  async updateProfile(token: string, data: any) {
    return this.request('/creators/profile', {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  // Opportunities
  async getOpportunities(token: string, filters?: any) {
    const params = new URLSearchParams(filters);
    return this.request(`/opportunities?${params}`, { token });
  }

  async getOpportunity(token: string, id: string) {
    return this.request(`/opportunities/${id}`, { token });
  }

  async applyToOpportunity(token: string, id: string, data: any) {
    return this.request(`/opportunities/${id}/apply`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  // Campaigns
  async getCampaigns(token: string, status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.request(`/creators/campaigns${params}`, { token });
  }

  async getCampaign(token: string, id: string) {
    return this.request(`/creators/campaigns/${id}`, { token });
  }

  async submitDeliverable(token: string, campaignId: string, deliverableId: string, data: any) {
    return this.request(`/creators/campaigns/${campaignId}/deliverables/${deliverableId}`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  // Portfolio
  async getPortfolio(token: string) {
    return this.request('/creators/portfolio', { token });
  }

  async uploadToPortfolio(token: string, data: any) {
    return this.request('/creators/portfolio', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async updatePortfolioItem(token: string, id: string, data: any) {
    return this.request(`/creators/portfolio/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    });
  }

  async deletePortfolioItem(token: string, id: string) {
    return this.request(`/creators/portfolio/${id}`, {
      method: 'DELETE',
      token,
    });
  }

  // Earnings
  async getEarnings(token: string) {
    return this.request('/creators/earnings', { token });
  }

  async requestPayout(token: string, data: { amount: number; method: string }) {
    return this.request('/creators/payouts', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  }

  async getPayouts(token: string) {
    return this.request('/creators/payouts', { token });
  }

  // Analytics
  async getAnalytics(token: string, period?: string) {
    const params = period ? `?period=${period}` : '';
    return this.request(`/creators/analytics${params}`, { token });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
