import axios from 'axios';

import { CONFIG } from 'src/config-global';

import { showToast } from 'src/components/toast';

import { STORAGE_KEY as JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.site.serverUrl });

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  return (
    sessionStorage.getItem(JWT_STORAGE_KEY) ||
    sessionStorage.getItem('accessToken') ||
    localStorage.getItem('accessToken')
  );
}

function clearStoredAccessTokens(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem(JWT_STORAGE_KEY);
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('accessToken');
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;

      const payload = decodeJwtPayload(accessToken);
      if (payload) {
        const userId = payload.sub || payload.userId || payload.user_id || payload.id;
        const orgId = config.headers['X-Org-Id'] || sessionStorage.getItem('organizationId') || payload.org_id || payload.orgId || payload.organizationId || payload.organization_id;

        if (userId) {
          config.headers['X-User-Id'] = userId;
        }
        if (orgId) {
          config.headers['X-Org-Id'] = orgId;
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipGlobalErrorToast = Boolean((error as any)?.config?.skipGlobalErrorToast);

    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        clearStoredAccessTokens();
        showToast({
          message: 'Your session has expired. Please sign in again.',
          severity: 'warning',
        });
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
      }
    }

    let message = 'Something went wrong!';

    if (error?.response?.data) {
      const {data} = error.response;
      if (typeof data.message === 'string') {
        message = data.message;
      } else if (Array.isArray(data.message) && typeof data.message[0] === 'string') {
        message = data.message[0];
      } else if (typeof data.error === 'string') {
        message = data.error;
      } else if (typeof data === 'string') {
        message = data;
      }
    } else if (error?.message) {
      message = error.message;
    }

    if (typeof window !== 'undefined' && !skipGlobalErrorToast) {
      showToast({
        message,
        severity: 'error',
      });
    }

    const finalError = new Error(message);
    (finalError as any).response = error.response;
    (finalError as any).statusCode = error.response?.status;
    (finalError as any).data = error.response?.data;

    return Promise.reject(finalError);
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  deals: {
    list: '/api/v1/deals',
    stats: '/api/v1/deals/stats',
    forecast: '/api/v1/deals/forecast',
    details: (id: string) => `/api/v1/deals/${id}`,
    stage: (id: string) => `/api/v1/deals/${id}/stage`,
  },
  email: {
    accounts: '/api/v1/email/accounts',
    messages: '/api/v1/email/messages',
    send: '/api/v1/email/send',
    templates: '/api/v1/email/templates',
    sequences: '/api/v1/email/sequences',
  },
  scoring: {
    list: '/api/v1/scoring',
    hot: '/api/v1/scoring/hot',
    details: (id: string) => `/api/v1/scoring/${id}`,
  },
};
