// ---------------------------------------------------------------------------
// apiClient.js
//
// Single source of truth for backend connectivity. Every service file in
// this folder imports `apiClient` instead of calling `fetch` directly, so
// when the real backend is ready, only THIS file needs to change (base URL,
// auth headers, error handling) — no other file in the app should need to
// know whether it's talking to mock data or a live API.
//
// HOW TO WIRE TO A REAL BACKEND:
//   1. Set VITE_API_BASE_URL in your .env file.
//   2. Each service's `mock*` functions can be swapped for the matching
//      `apiClient.get/post/put/delete` call shown commented below them.
//   3. Remove the artificial network delay (`simulateDelay`).
// ---------------------------------------------------------------------------

let BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api';

// Mixed-content guard: an HTTPS page cannot call an http:// API (the browser
// blocks it → "Failed to fetch"). If the app is served over HTTPS, upgrade an
// http:// API base to https://. Local dev (http page → http API) is untouched.
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  BASE_URL.startsWith('http://')
) {
  BASE_URL = BASE_URL.replace(/^http:\/\//i, 'https://');
}

export const TOKEN_KEY = 'authToken';

// Every request carries a deadline. Without one, a request that never settles
// leaves the caller's `loading` flag true forever — which is exactly how the
// Rider Fleet page ended up showing a spinner that never resolved.
//
// Sized to be a backstop, not a performance budget. It has to clear the slowest
// legitimate request — a cold container plus a first query while MongoDB is
// still building the new indexes — because aborting one of those would turn a
// slow page into a broken one. 30s is comfortably past that and still far short
// of "user assumes it is hung".
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Error thrown by every apiClient call. Carrying `status` lets callers tell a
 * rate limit (429, retry later) apart from a genuine "no rows" — previously
 * both arrived as a bare Error and services turned them into an empty array.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, path = '', isTimeout = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
    this.isTimeout = isTimeout;
    this.isRateLimited = status === 429;
    this.isNetwork = status === 0;
  }
}

// Only an authentication failure may clear the session.
//
// The server answers 401 when the Authorization header is missing/malformed and
// 403 "Invalid or expired token" when the JWT itself fails verification — so the
// old `status === 401` check never fired for the case it was written for, while
// a 429 or a dropped connection could still wipe the token through
// authService.getCurrentUser()'s catch-all. That was the "logged out at random /
// everything blank" report.
const isAuthFailure = (status, message) =>
  status === 401 || (status === 403 && (!message || /token|unauthorized|expired/i.test(message)));

const clearSessionIfAuthFailure = (status, message, hadToken) => {
  if (hadToken && isAuthFailure(status, message)) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    // Let the app react (drop to logged-out) instead of leaving each page to
    // discover the dead session on its own.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }
};

// Runs fetch with a timeout and normalizes failures into ApiError.
async function fetchWithTimeout(path, init, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs / 1000}s`, {
        path,
        isTimeout: true,
      });
    }
    throw new ApiError(err?.message || 'Network error', { path });
  } finally {
    clearTimeout(timer);
  }
}

// Shared response handling: unwrap the server envelope, or raise an ApiError.
async function handleResponse(response, path, hadToken) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.message ||
      (response.status === 429
        ? 'Server is busy right now. Please try again in a moment.'
        : `Request failed: ${response.status}`);
    clearSessionIfAuthFailure(response.status, message, hadToken);
    throw new ApiError(message, { status: response.status, path });
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  const payload = await response.json();
  // barcode_server wraps everything in { success, message, data } — unwrap `data`
  // so each service gets the payload directly (matches the old mock return shapes).
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (!payload.success) {
      throw new ApiError(payload.message || 'Request failed', {
        status: response.status,
        path,
      });
    }
    return payload.data;
  }
  return payload;
}

// Standard request wrapper — centralizes headers, auth token injection,
// and error normalization so every service gets the same behavior.
async function request(path, { method = 'GET', body, headers = {}, params, timeoutMs } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  let fullPath = path;
  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      fullPath += (fullPath.includes('?') ? '&' : '?') + qs;
    }
  }

  const response = await fetchWithTimeout(
    fullPath,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    timeoutMs,
  );

  return handleResponse(response, fullPath, Boolean(token));
}

// Multipart/form-data POST (file uploads). Do NOT set Content-Type — the
// browser adds the multipart boundary. Same auth + unwrap behavior as request().
async function requestForm(path, formData) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetchWithTimeout(
    path,
    {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    },
    // Uploads carry a photo and a licence PDF over mobile connections, so they
    // get a longer deadline than a plain JSON call.
    60000,
  );

  return handleResponse(response, path, Boolean(token));
}

// GET an auth-gated binary (image/PDF) and return an object URL for display.
// Caller should URL.revokeObjectURL() when done.
async function requestBlobUrl(path) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetchWithTimeout(path, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!response.ok) {
    clearSessionIfAuthFailure(response.status, '', Boolean(token));
    throw new ApiError(`Request failed: ${response.status}`, {
      status: response.status,
      path,
    });
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  getBlobUrl: (path) => requestBlobUrl(path),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  postForm: (path, formData) => requestForm(path, formData),
};

// Used by mock services to simulate realistic network latency during
// development, so loading states can be built/tested honestly. Delete
// the calls to this once real endpoints are in place.
export const simulateDelay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

export default apiClient;
