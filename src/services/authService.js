// ---------------------------------------------------------------------------
// authService.js
//
// LIVE BACKEND (barcode_server). All auth goes through the real API now.
// A JWT is stored in localStorage['authToken']; apiClient injects it as a
// Bearer header on every request. Function signatures are unchanged so
// AuthContext.jsx and the pages keep working as-is.
//
//   POST /api/auth/register        { name, email, password, ... } → { user, token }
//   POST /api/auth/login           { email, password }            → { user, token }
//   POST /api/auth/reset-password  { phone, newPassword }         → { message }
//   POST /api/auth/logout
//   GET  /api/auth/me              → user
//
// SECURITY: passwords are bcrypt-hashed server-side; role is assigned by the
// server (client-sent role is ignored), so /admin-signup can no longer mint
// an admin. See barcode_server for the full contract.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

const TOKEN_KEY = 'authToken';

/**
 * Returns the currently authenticated user, or null if logged out / token bad.
 * BACKEND: GET /api/auth/me
 */
export async function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    return await apiClient.get('/auth/me');
  } catch (err) {
    // Only an actual auth rejection ends the session. This used to catch
    // everything, so one rate-limited (429) or timed-out call silently deleted
    // a perfectly valid token and logged the admin out mid-session — apiClient
    // already clears the token itself when the server really rejects it.
    if (err?.isRateLimited || err?.isTimeout || err?.isNetwork) {
      throw err;
    }
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

/**
 * Creates a new account and logs in (stores the JWT).
 * BACKEND: POST /api/auth/register
 * NOTE: `role` is intentionally NOT sent — the server always assigns 'user'.
 */
export async function register({ name, email, password, phone, pickArea, address }) {
  const { user, token } = await apiClient.post('/auth/register', {
    name,
    email,
    password,
    phone,
    pickArea,
    address,
  });
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

/**
 * Logs in an existing user by phone/email and password (stores the JWT).
 * BACKEND: POST /api/auth/login
 */
export async function login(credentials) {
  // credentials অবজেক্টে { phone, password } অথবা { email, password } যা-ই আসুক, হুবহু ব্যাকএন্ডে যাবে
  const { user, token } = await apiClient.post('/auth/login', credentials);
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

/**
 * 🔑 Resets password for a user/rider by registered phone number or email.
 * BACKEND: POST /api/auth/reset-password
 */
export async function resetPasswordService({ phone, email, newPassword }) {
  return apiClient.post('/auth/reset-password', {
    phone,
    email,
    newPassword,
  });
}

/**
 * Dedicated rider signup — creates a pending rider account and logs in
 * immediately (stores the JWT). `formData` is multipart (includes photo + license).
 * BACKEND: POST /api/riders/register → { user, token }
 */
export async function registerRider(formData) {
  const { user, token } = await apiClient.postForm('/riders/register', formData);
  localStorage.setItem(TOKEN_KEY, token);
  return user;
}

/**
 * Updates the logged-in user's own profile (name, phone, pickArea, address).
 * BACKEND: PATCH /api/users/me → updated user
 */
export async function updateMe(payload) {
  return apiClient.patch('/users/me', payload);
}

/**
 * Ends the current session.
 * BACKEND: POST /api/auth/logout
 */
export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // ignore network/logout errors — we clear the token regardless
  }
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Converts a thrown auth error into a user-facing message.
 */
export function getAuthErrorMessage(error) {
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * 🎯 POS Scanner / Customer Search Lookup
 * BACKEND: GET /api/users/pos-lookup/:query
 */
export async function posLookupCustomer(query) {
  return apiClient.get(`/users/pos-lookup/${encodeURIComponent(query)}`);
}

/**
 * Admin-only list of all users.
 * BACKEND: GET /api/users
 */
export async function getAllUsers() {
  return apiClient.get('/users');
}