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

// Standard request wrapper — centralizes headers, auth token injection,
// and error normalization so every service gets the same behavior.
async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = localStorage.getItem('authToken'); // placeholder auth flow

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    // handle expired/invalid token → clear it so the app drops to logged-out
    if (response.status === 401) localStorage.removeItem('authToken');
    throw new Error(errorBody.message || `Request failed: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;

  const payload = await response.json();
  // barcode_server wraps everything in { success, message, data } — unwrap `data`
  // so each service gets the payload directly (matches the old mock return shapes).
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (!payload.success) throw new Error(payload.message || 'Request failed');
    return payload.data;
  }
  return payload;
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

// Used by mock services to simulate realistic network latency during
// development, so loading states can be built/tested honestly. Delete
// the calls to this once real endpoints are in place.
export const simulateDelay = (ms = 300) => new Promise((res) => setTimeout(res, ms));

export default apiClient;
