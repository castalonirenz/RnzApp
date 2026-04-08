import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const { user, token, isAuthChecked, isLoading, error, login, register, logout, setUser, setToken, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { user, token, isAuthChecked, isLoading, error, login, register, logout, setUser, setToken };
};
