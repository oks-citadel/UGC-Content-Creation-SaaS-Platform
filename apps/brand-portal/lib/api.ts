import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API functions
export const apiClient = {
  // Campaigns
  campaigns: {
    getAll: () => api.get('/campaigns'),
    getById: (id: string) => api.get(`/campaigns/${id}`),
    create: (data: any) => api.post('/campaigns', data),
    update: (id: string, data: any) => api.put(`/campaigns/${id}`, data),
    delete: (id: string) => api.delete(`/campaigns/${id}`),
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
}
