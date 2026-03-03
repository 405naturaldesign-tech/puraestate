'use client';

import { useCallback, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { authApi } from '@/lib/api/auth';
import { clearTokens, isAuthenticated } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store';
import type { LoginCredentials, RegisterData } from '@/lib/types';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated: authenticated, isLoading, setUser, setLoading, logout: clearUser } = useAuthStore();

  // Hydrate user on mount
  useEffect(() => {
    const hydrate = async () => {
      if (isAuthenticated() && !user) {
        setLoading(true);
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch {
          clearTokens();
          setUser(null);
        }
      } else {
        setLoading(false);
      }
    };
    hydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        const { user: loggedInUser } = await authApi.login(credentials);
        setUser(loggedInUser);
        router.push('/dashboard');
        return loggedInUser;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [router, setUser, setLoading]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      setLoading(true);
      try {
        const { user: newUser } = await authApi.register(data);
        setUser(newUser);
        router.push('/dashboard');
        return newUser;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [router, setUser, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearUser();
      clearTokens();
      router.push('/');
    }
  }, [clearUser, router]);

  const requireAuth = useCallback(
    (redirectTo = '/auth/login') => {
      if (!isLoading && !authenticated) {
        router.push(`${redirectTo}?next=${encodeURIComponent(window.location.pathname)}`);
      }
    },
    [authenticated, isLoading, router]
  );

  return {
    user,
    isAuthenticated: authenticated,
    isLoading,
    login,
    register,
    logout,
    requireAuth,
    isAdmin: user?.role === 'admin' || user?.role === 'moderator',
    isAgent: user?.role === 'agent',
  };
}
