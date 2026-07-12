// ---------------------------------------------------------------------------
// aboutService.js — LIVE BACKEND
//
// ⚠️ Timeline & leadership items are now addressed by a STABLE id (from the
// server), NOT by array index (audit #4.10 fix). Callers must pass item.id
// (see AdminAbout.jsx) instead of the array index.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/about */
export async function getAboutData() {
  return apiClient.get('/about');
}

/** PUT /api/about — mission / vision / stats */
export async function updateAboutCore(fields) {
  return apiClient.put('/about', fields);
}

// ── Timeline (by stable id) ──
export async function addTimelineItem(item) {
  return apiClient.post('/about/timeline', item);
}
export async function updateTimelineItem(id, item) {
  return apiClient.put(`/about/timeline/${id}`, item);
}
export async function deleteTimelineItem(id) {
  return apiClient.delete(`/about/timeline/${id}`);
}

// ── Leadership (by stable id) ──
export async function addLeadershipMember(member) {
  return apiClient.post('/about/leadership', member);
}
export async function updateLeadershipMember(id, member) {
  return apiClient.put(`/about/leadership/${id}`, member);
}
export async function deleteLeadershipMember(id) {
  return apiClient.delete(`/about/leadership/${id}`);
}
