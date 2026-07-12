// ---------------------------------------------------------------------------
// authService.js
//
// LIVE BACKEND (barcode_server). All auth goes through the real API now.
// A JWT is stored in localStorage['authToken']; apiClient injects it as a
// Bearer header on every request. Function signatures are unchanged so
// AuthContext.jsx and the pages keep working as-is.
//
//   POST /api/auth/register  { name, email, password, ... } → { user, token }
//   POST /api/auth/login     { email, password }            → { user, token }
//   POST /api/auth/logout
//   GET  /api/auth/me        → user
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
  } catch {
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
 * Logs in an existing user by email/password (stores the JWT).
 * BACKEND: POST /api/auth/login
 */
export async function login({ email, password }) {
  const { user, token } = await apiClient.post('/auth/login', { email, password });
  localStorage.setItem(TOKEN_KEY, token);
  return user;
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
 * Admin-only list of all users.
 * BACKEND: GET /api/users
 */
export async function getAllUsers() {
  return apiClient.get('/users');
}
