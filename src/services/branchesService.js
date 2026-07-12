// ---------------------------------------------------------------------------
// branchesService.js — LIVE BACKEND
// All branch data now comes from the API (manager/capacity/features included).
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/branches */
export async function getAllBranches() {
  return apiClient.get('/branches');
}

/** GET /api/branches/:id */
export async function getBranchById(id) {
  return apiClient.get(`/branches/${id}`);
}

/** GET /api/branches?limit=6 — Home page preview */
export async function getFeaturedBranches(limit = 6) {
  return apiClient.get(`/branches?limit=${limit}`);
}

/** GET /api/branches/search?q=... */
export async function searchBranches(query) {
  const q = (query || '').trim();
  if (!q) return [];
  return apiClient.get(`/branches/search?q=${encodeURIComponent(q)}`);
}

/** POST /api/branches (admin) */
export async function createBranch(branch) {
  return apiClient.post('/branches', branch);
}

/** PATCH /api/branches/:id (admin) */
export async function updateBranch(id, updatedFields) {
  return apiClient.patch(`/branches/${id}`, updatedFields);
}

/** DELETE /api/branches/:id (admin) */
export async function deleteBranch(id) {
  return apiClient.delete(`/branches/${id}`);
}
