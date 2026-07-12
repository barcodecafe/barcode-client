// ---------------------------------------------------------------------------
// regionsService.js — LIVE BACKEND
// Regions are the top-level grouping above branches (e.g. Dhaka, Chattogram).
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/regions */
export async function getAllRegions() {
  return apiClient.get('/regions');
}

/** POST /api/regions (admin) */
export async function createRegion(region) {
  return apiClient.post('/regions', region);
}

/** PATCH /api/regions/:id (admin) */
export async function updateRegion(id, updatedFields) {
  return apiClient.patch(`/regions/${id}`, updatedFields);
}

/** DELETE /api/regions/:id (admin) */
export async function deleteRegion(id) {
  return apiClient.delete(`/regions/${id}`);
}
