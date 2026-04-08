import axios from 'axios';

const API_URL =  process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL  || 'http://localhost:4000/api';

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

export default apiClient;
