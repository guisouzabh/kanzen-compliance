// src/services/api.ts
import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api/v1';

const api = axios.create({
  baseURL
});

// Interceptor para enviar o token automaticamente (vamos usar depois)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
