import axios from 'axios';

export const ADMIN_PASSWORD_KEY = 'ahance_admin_password';

export function getAdminPassword() {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

export function hasAdminPassword() {
  return Boolean(getAdminPassword());
}

export function setAdminPassword(password) {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
  window.dispatchEvent(new Event('admin-auth-changed'));
}

export function clearAdminPassword() {
  localStorage.removeItem(ADMIN_PASSWORD_KEY);
  window.dispatchEvent(new Event('admin-auth-changed'));
}

let interceptorConfigured = false;

export function setupAdminAxiosInterceptor({ onUnauthorized } = {}) {
  if (interceptorConfigured) return;
  interceptorConfigured = true;

  axios.interceptors.request.use((config) => {
    const method = (config.method || 'get').toLowerCase();

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const password = getAdminPassword();
      if (password) {
        config.headers = config.headers || {};
        config.headers['x-admin-password'] = password;
      }
    }

    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        clearAdminPassword();
        if (typeof onUnauthorized === 'function') {
          onUnauthorized(error);
        }
      }
      return Promise.reject(error);
    }
  );
}
