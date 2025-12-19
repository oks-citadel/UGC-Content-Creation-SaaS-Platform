import { useState } from 'react';
import { useUserStore } from '@/stores/user.store';
import { apiClient } from '@/lib/api';
import { authUtils } from '@/lib/auth';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setToken, logout: logoutStore } = useUserStore();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(email, password);

      // Store tokens and user data
      authUtils.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      authUtils.setUser(response.user);

      setToken(response.accessToken);
      setUser(response.user);

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    niche: string;
    socialHandle: string;
    platform: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.register(data);

      // Store tokens and user data
      authUtils.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      authUtils.setUser(response.user);

      setToken(response.accessToken);
      setUser(response.user);

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      const token = authUtils.getAccessToken();
      if (token) {
        await apiClient.logout(token);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      authUtils.logout();
      logoutStore();
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
    error,
  };
}
