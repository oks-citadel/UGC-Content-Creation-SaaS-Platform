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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = 'nexus_creator_token';
const REFRESH_TOKEN_KEY = 'nexus_creator_refresh_token';
const USER_KEY = 'nexus_creator_user';

export const authUtils = {
  // Token management
  setTokens(tokens: AuthTokens) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  },

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // User management
  setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  clearUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  // Auth state
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  // Logout
  logout() {
    this.clearTokens();
    this.clearUser();
  },
};
