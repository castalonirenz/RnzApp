import { create } from 'zustand';
import { authService } from '@/services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthChecked: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({ 
        user: data.user, 
        token: data.token, 
        isAuthChecked: true,
        isLoading: false 
      });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({ 
        user: data.user, 
        token: data.token, 
        isAuthChecked: true,
        isLoading: false 
      });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, token: null, isAuthChecked: true, isLoading: false });
    } catch (error) {
      set({ error: 'Logout failed', isLoading: false });
    }
  },

  checkAuth: () => {
    const user = authService.getUser();
    const token = authService.getToken();
    if (user && token) {
      set({ user, token, isAuthChecked: true });
      return;
    }
    set({ user: null, token: null, isAuthChecked: true });
  },
}));
