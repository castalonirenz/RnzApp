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
      let resolvedUser = data.user || authService.getUser();

      if (!resolvedUser && data.token) {
        try {
          resolvedUser = await authService.getCurrentUser();
        } catch {
          resolvedUser = null;
        }
      }

      set({ 
        user: resolvedUser, 
        token: data.token, 
        isAuthChecked: true,
        isLoading: false 
      });
      return { ...data, user: resolvedUser };
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
      let resolvedUser = data.user || authService.getUser();

      if (!resolvedUser && data.token) {
        try {
          resolvedUser = await authService.getCurrentUser();
        } catch {
          resolvedUser = null;
        }
      }

      set({ 
        user: resolvedUser, 
        token: data.token, 
        isAuthChecked: true,
        isLoading: false 
      });
      return { ...data, user: resolvedUser };
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.forgotPassword(email);
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to request password reset',
        isLoading: false,
      });
      throw error;
    }
  },

  resetPassword: async ({ token, password, confirm_password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.resetPassword({ token, password, confirm_password });
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to reset password',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (error) {
      // Ignore API errors on logout; local session must still be cleared.
    } finally {
      set({ user: null, token: null, isAuthChecked: true, isLoading: false, error: null });
    }
  },

  forceLogout: () => {
    set({ user: null, token: null, isAuthChecked: true, isLoading: false, error: null });
  },

  checkAuth: async () => {
    const user = authService.getUser();
    const token = authService.getToken();

    if (!token) {
      set({ user: null, token: null, isAuthChecked: true });
      return;
    }

    if (user) {
      set({ user, token, isAuthChecked: true });
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      set({ user: currentUser, token, isAuthChecked: true });
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthChecked: true });
    }
  },
}));
