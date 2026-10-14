import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiUrl.js';

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60000,
});

function isPublicAuthPath() {
  return Boolean(window.location.pathname.match(/^\/(login|register|share)(\/|$)/));
}

function isAnonymousPublicLinkRequest(url = '') {
  // Token access endpoints: GET/POST /public-links/:token[...]
  // Exclude authenticated manage routes: /public-links/manage/:id
  return /\/public-links\/(?!manage(?:\/|$))[^/?]+/.test(url);
}

api.interceptors.request.use((config) => {
  // Never attach session JWT to anonymous public-link token requests
  if (isAnonymousPublicLinkRequest(config.url || '')) {
    return config;
  }

  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (!response.data.success) {
        return Promise.reject(new Error(response.data.message || 'API Error'));
      }
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;

    // Public share password / token errors must not trigger login redirects
    if (
      isAnonymousPublicLinkRequest(original?.url || '') ||
      errorCode === 'PASSWORD_REQUIRED' ||
      errorCode === 'INVALID_PASSWORD' ||
      errorCode === 'LINK_EXPIRED' ||
      errorCode === 'LINK_DISABLED'
    ) {
      const message =
        error.response?.data?.message || error.message || 'Something went wrong';
      return Promise.reject(new Error(message));
    }

    if (status === 401 && !original?._retry && !original?.url?.includes('/auth/login')) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
            refreshToken,
          });
          if (!data.success) throw new Error(data.message || 'Refresh failed');
          const tokens = data.data;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          original.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (!isPublicAuthPath()) {
            window.location.href = '/login';
          }
        }
      } else if (!isPublicAuthPath()) {
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    const errObj = new Error(message);
    errObj.response = error.response;
    errObj.data = error.response?.data;
    return Promise.reject(errObj);
  }
);

export default api;
