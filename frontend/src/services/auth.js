/**
 * Google Auth Service for AKAR Studio
 */

const TOKEN_KEY = 'akr_auth_token';
const USER_KEY = 'akr_auth_user';

/**
 * Safely parse a JWT without external libraries
 */
export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Failed to parse JWT payload:', e);
    return null;
  }
};

/**
 * Get the Google OAuth login URL on the auth service
 */
export const getGoogleAuthUrl = () => {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // In local dev, auth service is at http://localhost:3009/auth/google
  // In production / k8s ingress, it routes via /auth/google
  if (isLocalhost) {
    return 'http://localhost:3009/auth/google';
  }
  return '/auth/google';
};

/**
 * Retrieve the currently stored user from localStorage if not expired
 */
export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }

  // Check expiration (exp is in seconds)
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    console.warn('Authentication token expired');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }

  // Normalize user fields
  let name = payload.name;
  if (typeof name === 'object' && name !== null) {
    name = [name.givenName, name.familyName].filter(Boolean).join(' ') || payload.email;
  }

  return {
    id: payload.id || payload._id || payload.sub,
    email: payload.email,
    name: name || payload.email?.split('@')[0] || 'User',
    token,
  };
};

/**
 * Store the received token and return normalized user object
 */
export const storeAuthToken = (token) => {
  if (!token) return null;
  localStorage.setItem(TOKEN_KEY, token);
  const user = getStoredUser();
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  return user;
};

/**
 * Log out user and clean localStorage
 */
export const logoutUser = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Inspect the current URL for a ?token=... query param from OAuth callback
 */
export const extractTokenFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    // Clean URL without triggering a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    return token;
  }
  return null;
};
