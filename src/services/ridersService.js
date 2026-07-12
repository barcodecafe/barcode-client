// ---------------------------------------------------------------------------
// ridersService.js — LIVE BACKEND
// A rider is a User(role:'rider'); the fleet shape {id,name,phone,vehicle,status}
// is returned by the API.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/riders (admin) */
export async function getAllRiders() {
  return apiClient.get('/riders');
}

/** GET /api/riders/:id */
export async function getRiderById(id) {
  return apiClient.get(`/riders/${id}`);
}

/** PATCH /api/riders/:id/status { status: 'Available' | 'Busy' } */
export async function updateRiderStatus(id, newStatus) {
  return apiClient.patch(`/riders/${id}/status`, { status: newStatus });
}

/**
 * Dedicated rider signup (multipart). fields: name, email, password, phone,
 * address, nid, experience, expYears + photo (image) + license (PDF).
 * Returns { user, token } — caller stores the token for auto-login.
 * POST /api/riders/register
 */
export async function registerRider(formData) {
  return apiClient.postForm('/riders/register', formData);
}

/** GET /api/rider-applications (admin) — all applications for review */
export async function getRiderApplications() {
  return apiClient.get('/rider-applications');
}

/** POST /api/rider-applications/:id/approve (admin) */
export async function approveRiderApplication(id) {
  return apiClient.post(`/rider-applications/${id}/approve`);
}

/** POST /api/rider-applications/:id/reject (admin) */
export async function rejectRiderApplication(id) {
  return apiClient.post(`/rider-applications/${id}/reject`);
}

/** GET /api/rider-applications/:id/documents (admin) — auth-gated doc URLs */
export async function getApplicationDocuments(id) {
  return apiClient.get(`/rider-applications/${id}/documents`);
}

/**
 * Fetch a rider's document (photo|license) as an object URL (auth-gated stream).
 * Revoke the URL when done. GET /api/rider-applications/:id/documents/:type
 */
export async function getApplicationDocUrl(id, type) {
  return apiClient.getBlobUrl(`/rider-applications/${id}/documents/${type}`);
}
