const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.error?.message || 'An error occurred',
        data.error?.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return data.data as T;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string, mfaToken?: string) =>
    api.post<{
      user: { id: string; email: string; firstName: string; lastName: string; role: string };
      tokens: { accessToken: string; refreshToken: string };
      requiresMfa?: boolean;
    }>('/api/auth/login', { email, password, mfaToken }),

  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/api/auth/register', data),

  logout: () => api.post('/api/auth/logout'),

  refreshTokens: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) => api.post('/api/auth/password/forgot', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/password/reset', { token, password }),
};

// User API
export const userApi = {
  getMe: () => api.get('/api/users/me'),

  updateMe: (data: { firstName?: string; lastName?: string; displayName?: string }) =>
    api.patch('/api/users/me', data),

  getPreferences: () => api.get('/api/users/me/preferences'),

  updatePreferences: (data: { theme?: string; language?: string }) =>
    api.patch('/api/users/me/preferences', data),
};

// Campaign API
export const campaignApi = {
  list: (params?: { status?: string; page?: number; limit?: number; search?: string }) =>
    api.get('/api/campaigns', { params }),

  get: (id: string) => api.get(`/api/campaigns/${id}`),

  create: (data: { name: string; description?: string; type?: string }) =>
    api.post('/api/campaigns', data),

  update: (id: string, data: { name?: string; description?: string; status?: string }) =>
    api.patch(`/api/campaigns/${id}`, data),

  delete: (id: string) => api.delete(`/api/campaigns/${id}`),
};

// Content API
export const contentApi = {
  list: (params?: { type?: string; page?: number; limit?: number }) =>
    api.get('/api/content/media', { params }),

  get: (id: string) => api.get(`/api/content/media/${id}`),

  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/content/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${api['accessToken']}`,
      },
      body: formData,
    });

    return response.json();
  },

  delete: (id: string) => api.delete(`/api/content/media/${id}`),
};

// AI API
export const aiApi = {
  generateImage: (data: { prompt: string; style?: string; aspectRatio?: string }) =>
    api.post('/api/ai/generate/image', data),

  generateScript: (data: {
    topic: string;
    platform: string;
    duration: number;
    tone: string;
  }) => api.post('/api/ai/generate/script', data),

  generateCaption: (data: {
    contentDescription: string;
    platform: string;
    tone: string;
  }) => api.post('/api/ai/generate/caption', data),

  generateHashtags: (data: { contentDescription: string; platform: string }) =>
    api.post('/api/ai/generate/hashtags', data),

  analyzeContent: (data: { contentUrl: string; analysisType?: string }) =>
    api.post('/api/ai/analyze/content', data),
};

export default api;
