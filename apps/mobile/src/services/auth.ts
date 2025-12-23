import { apiClient, User } from './api';
import * as storage from './storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  niche: string;
  socialHandle: string;
  platform: 'instagram' | 'youtube' | 'tiktok' | 'twitter';
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.login(credentials.email, credentials.password);
    return response.user;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.register(data);
    return response.user;
  }

  async logout(): Promise<void> {
    await apiClient.logout();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const isAuth = await storage.isAuthenticated();
      if (!isAuth) {
        return null;
      }

      const storedUser = await storage.getUser();
      if (storedUser) {
        this.refreshUserData().catch(console.error);
        return storedUser as User;
      }

      const user = await apiClient.getProfile();
      await storage.setUser(user);
      return user;
    } catch {
      return null;
    }
  }

  async refreshUserData(): Promise<User | null> {
    try {
      const user = await apiClient.getProfile();
      await storage.setUser(user);
      return user;
    } catch {
      return null;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const user = await apiClient.updateProfile(data);
    await storage.setUser(user);
    return user;
  }

  async checkAuthStatus(): Promise<boolean> {
    return storage.isAuthenticated();
  }

  async forgotPassword(email: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Password reset email sent to:', email);
  }
}

export const authService = new AuthService();

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const validateFullName = (name: string): boolean => {
  return name.trim().length >= 2;
};
