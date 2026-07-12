// ---------------------------------------------------------------------------
// favoritesService.js  — LIVE BACKEND
//
// Per-user favorites (audit #23 fix): favorites now live on the server keyed
// to the authenticated user, so different accounts no longer share one list.
//   GET    /api/users/me/favorites        → number[] of food ids
//   POST   /api/users/me/favorites  {foodId}
//   DELETE /api/users/me/favorites/:foodId
// Every function returns the updated id array (same shape as before).
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

const hasToken = () => !!localStorage.getItem('authToken');

/** GET /api/users/me/favorites — [] when logged out. */
export async function getFavorites() {
  if (!hasToken()) return [];
  try {
    return await apiClient.get('/users/me/favorites');
  } catch {
    return [];
  }
}

/** POST /api/users/me/favorites { foodId } */
export async function addFavorite(foodId) {
  return apiClient.post('/users/me/favorites', { foodId });
}

/** DELETE /api/users/me/favorites/:foodId */
export async function removeFavorite(foodId) {
  return apiClient.delete(`/users/me/favorites/${foodId}`);
}

/** Convenience toggle — fetches current state then adds/removes. */
export async function toggleFavorite(foodId) {
  if (!hasToken()) return [];
  const ids = await getFavorites();
  return ids.includes(foodId) ? removeFavorite(foodId) : addFavorite(foodId);
}
