import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  // Add security headers to mitigate CSRF
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Intercept 401 Unauthorized globally to reset session
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
