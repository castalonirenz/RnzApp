import apiClient from '@/utils/api';

const extractAuthData = (payload) => {
  const token =
    payload?.token ||
    payload?.access_token ||
    payload?.data?.token ||
    payload?.data?.access_token ||
    null;

  const user =
    payload?.user ||
    payload?.data?.user ||
    null;

  return { token, user };
};

export const authService = {
  register: async (data) => {
    const payload = {
      name: data?.name,
      email: data?.email,
      password: data?.password,
      confirm_password: data?.confirm_password ?? data?.password_confirmation,
    };

    const response = await apiClient.post('/register', payload);
    const { token, user } = extractAuthData(response.data);

    if (token) {
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }

    return { ...response.data, token, user };
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/forgot-password', { email });
    return response?.data;
  },

  resetPassword: async ({ token, password, confirm_password }) => {
    const response = await apiClient.post('/reset-password', {
      token,
      password,
      confirm_password,
    });
    return response?.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/login', { email, password });
    const { token, user } = extractAuthData(response.data);

    if (token) {
      localStorage.setItem('token', token);
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }

    return { ...response.data, token, user };
  },

  logout: async () => {
    try {
      await apiClient.post('/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/user');
    const user = response.data?.user || response.data?.data?.user || response.data?.data || response.data;

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    return user;
  },

  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (!user) {
        return null;
      }

      try {
        return JSON.parse(user);
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  },
};
