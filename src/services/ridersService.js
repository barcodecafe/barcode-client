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
