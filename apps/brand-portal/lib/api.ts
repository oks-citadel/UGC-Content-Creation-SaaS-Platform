import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4001/auth'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token storage utilities
export const tokenStorage = {
  getAccessToken: () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  getRefreshToken: () => typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    }
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  },
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    }
    return null
  },
  setUser: (user: AuthUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user))
    }
  },
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  mfaEnabled: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  mfaToken?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: AuthUser
    tokens: {
      accessToken: string
      refreshToken: string
      accessTokenExpiresAt: string
      refreshTokenExpiresAt: string
    }
    requiresMfa?: boolean
  }
  error?: {
    code: string
    message: string
    details?: unknown[]
  }
}

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true

      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        try {
          const response = await authApi.post<AuthResponse>('/refresh', { refreshToken })
          if (response.data.success && response.data.data?.tokens) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
            tokenStorage.setTokens(accessToken, newRefreshToken)

            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              return api(originalRequest)
            }
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect
          tokenStorage.clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        }
      } else {
        // No refresh token, redirect to login
        tokenStorage.clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// API functions
export const apiClient = {
  // Auth
  auth: {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await authApi.post<AuthResponse>('/login', credentials)
      if (response.data.success && response.data.data?.tokens) {
        const { accessToken, refreshToken } = response.data.data.tokens
        tokenStorage.setTokens(accessToken, refreshToken)
        tokenStorage.setUser(response.data.data.user)
      }
      return response.data
    },
    register: async (data: RegisterData): Promise<AuthResponse> => {
      const response = await authApi.post<AuthResponse>('/register', data)
      if (response.data.success && response.data.data?.tokens) {
        const { accessToken, refreshToken } = response.data.data.tokens
        tokenStorage.setTokens(accessToken, refreshToken)
        tokenStorage.setUser(response.data.data.user)
      }
      return response.data
    },
    logout: async (): Promise<void> => {
      try {
        await authApi.post('/logout', {}, {
          headers: {
            Authorization: `Bearer ${tokenStorage.getAccessToken()}`
          }
        })
      } finally {
        tokenStorage.clearTokens()
      }
    },
    refresh: async (): Promise<AuthResponse> => {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }
      const response = await authApi.post<AuthResponse>('/refresh', { refreshToken })
      if (response.data.success && response.data.data?.tokens) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens
        tokenStorage.setTokens(accessToken, newRefreshToken)
      }
      return response.data
    },
    forgotPassword: (email: string) => authApi.post('/password/forgot', { email }),
    resetPassword: (token: string, password: string) =>
      authApi.post('/password/reset', { token, password }),
    getCurrentUser: () => tokenStorage.getUser(),
    isAuthenticated: () => !!tokenStorage.getAccessToken(),
  },

  // Campaigns
  campaigns: {
    getAll: () => api.get('/campaigns'),
    getById: (id: string) => api.get(`/campaigns/${id}`),
    create: (data: any) => api.post('/campaigns', data),
    update: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
    delete: (id: string) => api.delete(`/campaigns/${id}`),
    // Brief management
    saveBrief: (campaignId: string, data: any) => api.put(`/campaigns/${campaignId}/brief`, data),
    getBrief: (campaignId: string) => api.get(`/campaigns/${campaignId}/brief`),
    // Deliverables
    addDeliverable: (campaignId: string, data: any) => api.post(`/campaigns/${campaignId}/deliverables`, data),
    updateDeliverable: (campaignId: string, deliverableId: string, data: any) =>
      api.patch(`/campaigns/${campaignId}/deliverables/${deliverableId}`, data),
    deleteDeliverable: (campaignId: string, deliverableId: string) =>
      api.delete(`/campaigns/${campaignId}/deliverables/${deliverableId}`),
  },

  // Creators
  creators: {
    getAll: (params?: any) => api.get('/creators', { params }),
    getById: (id: string) => api.get(`/creators/${id}`),
    invite: (id: string, campaignId: string) =>
      api.post(`/creators/${id}/invite`, { campaignId }),
  },

  // Content
  content: {
    getAll: (params?: any) => api.get('/content', { params }),
    getById: (id: string) => api.get(`/content/${id}`),
    approve: (id: string) => api.post(`/content/${id}/approve`),
    reject: (id: string, reason: string) =>
      api.post(`/content/${id}/reject`, { reason }),
  },

  // Analytics
  analytics: {
    getCampaignMetrics: (campaignId: string) =>
      api.get(`/analytics/campaigns/${campaignId}`),
    getOverview: () => api.get('/analytics/overview'),
    getAttribution: (params?: any) =>
      api.get('/analytics/attribution', { params }),
  },

  // Galleries
  galleries: {
    getAll: () => api.get('/galleries'),
    getById: (id: string) => api.get(`/galleries/${id}`),
    create: (data: any) => api.post('/galleries', data),
    update: (id: string, data: any) => api.put(`/galleries/${id}`, data),
    delete: (id: string) => api.delete(`/galleries/${id}`),
  },

  // Team
  team: {
    getMembers: () => api.get('/team'),
    invite: (data: { email: string; role: string }) =>
      api.post('/team/invite', data),
    remove: (id: string) => api.delete(`/team/${id}`),
    updateRole: (id: string, role: string) =>
      api.put(`/team/${id}/role`, { role }),
  },

  // Settings
  settings: {
    get: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
  },

  // Products (Commerce)
  products: {
    getAll: (params?: { search?: string; limit?: number; offset?: number }) =>
      api.get('/commerce/products', { params }),
    getById: (id: string) => api.get(`/commerce/products/${id}`),
    search: (query: string) =>
      api.get('/commerce/products/search', { params: { q: query } }),
  },

  // Content Schedule
  schedule: {
    getByMonth: (year: number, month: number) =>
      api.get('/content/schedule', { params: { year, month } }),
    getUpcoming: (days?: number) =>
      api.get('/content/schedule/upcoming', { params: { days: days || 30 } }),
    create: (data: { contentId: string; scheduledAt: Date; platform: string }) =>
      api.post('/content/schedule', data),
    update: (id: string, data: any) =>
      api.put(`/content/schedule/${id}`, data),
    delete: (id: string) =>
      api.delete(`/content/schedule/${id}`),
  },
}
