/**
 * Admin API utilities
 * Provides type-safe API calls with error handling and audit logging
 */

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

class AdminApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

/**
 * Base API request handler with error handling and audit logging
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  try {
    const response = await fetch(`/api/admin${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AdminApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return {
      data,
      success: true,
    };
  } catch (error) {
    if (error instanceof AdminApiError) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false,
    };
  }
}

/**
 * User Management API
 */
export const users = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/users${query}`);
  },

  get: (id: string) => apiRequest(`/users/${id}`),

  create: (data: any) =>
    apiRequest('/users', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: any) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: data,
    }),

  suspend: (id: string) =>
    apiRequest(`/users/${id}/suspend`, {
      method: 'POST',
    }),

  activate: (id: string) =>
    apiRequest(`/users/${id}/activate`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Organization Management API
 */
export const organizations = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/organizations${query}`);
  },

  get: (id: string) => apiRequest(`/organizations/${id}`),

  update: (id: string, data: any) =>
    apiRequest(`/organizations/${id}`, {
      method: 'PUT',
      body: data,
    }),

  suspend: (id: string) =>
    apiRequest(`/organizations/${id}/suspend`, {
      method: 'POST',
    }),
};

/**
 * Creator Management API
 */
export const creators = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/creators${query}`);
  },

  get: (id: string) => apiRequest(`/creators/${id}`),

  verify: (id: string) =>
    apiRequest(`/creators/${id}/verify`, {
      method: 'POST',
    }),

  reject: (id: string, reason: string) =>
    apiRequest(`/creators/${id}/reject`, {
      method: 'POST',
      body: { reason },
    }),
};

/**
 * Content Moderation API
 */
export const content = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/content${query}`);
  },

  get: (id: string) => apiRequest(`/content/${id}`),

  approve: (id: string) =>
    apiRequest(`/content/${id}/approve`, {
      method: 'POST',
    }),

  reject: (id: string, reason: string) =>
    apiRequest(`/content/${id}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  flag: (id: string, reason: string) =>
    apiRequest(`/content/${id}/flag`, {
      method: 'POST',
      body: { reason },
    }),
};

/**
 * Billing API
 */
export const billing = {
  stats: () => apiRequest('/billing/stats'),

  invoices: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/billing/invoices${query}`);
  },

  invoice: (id: string) => apiRequest(`/billing/invoices/${id}`),
};

/**
 * Payout API
 */
export const payouts = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/payouts${query}`);
  },

  process: (id: string) =>
    apiRequest(`/payouts/${id}/process`, {
      method: 'POST',
    }),
};

/**
 * System API
 */
export const system = {
  health: () => apiRequest('/system/health'),

  logs: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/system/logs${query}`);
  },

  jobs: () => apiRequest('/system/jobs'),

  metrics: () => apiRequest('/system/metrics'),
};

/**
 * Dashboard API
 */
export const dashboard = {
  stats: () => apiRequest('/dashboard/stats'),

  activity: () => apiRequest('/dashboard/activity'),
};

/**
 * Compliance API
 */
export const compliance = {
  disputes: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/compliance/disputes${query}`);
  },

  dispute: (id: string) => apiRequest(`/compliance/disputes/${id}`),

  rights: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiRequest(`/compliance/rights${query}`);
  },
};

/**
 * Export all API endpoints
 */
export const api = {
  users,
  organizations,
  creators,
  content,
  billing,
  payouts,
  system,
  dashboard,
  compliance,
};

export default api;
