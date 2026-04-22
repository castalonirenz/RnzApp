import axios from 'axios';

const API_URL =  process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL  || 'http://localhost:4000/api';
const AUTH_BYPASS_PATHS = ['/login', '/register'];

const isAuthBypassRequest = (url = '') => {
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');

    if (status === 401 && typeof window !== 'undefined' && !isAuthBypassRequest(requestUrl)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
