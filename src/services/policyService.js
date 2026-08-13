import apiClient from './apiClient';

/** GET /api/policies/:type (public - 'privacy-policy' | 'terms-of-service') */
export async function getPolicy(type) {
  const res = await apiClient.get(`/policies/${type}`);
  return res?.data || res;
}

/** PUT /api/policies/:type (admin) — Update Header title & lastUpdated */
export async function updatePolicyHeader(type, data) {
  const res = await apiClient.put(`/policies/${type}`, data);
  return res?.data || res;
}

/** POST /api/policies/:type/sections (admin) — Add new section */
export async function addPolicySection(type, section) {
  const res = await apiClient.post(`/policies/${type}/sections`, section);
  return res?.data || res;
}

/** PUT /api/policies/:type/sections/:sectionId (admin) — Update section */
export async function updatePolicySection(type, sectionId, section) {
  const res = await apiClient.put(`/policies/${type}/sections/${sectionId}`, section);
  return res?.data || res;
}

/** DELETE /api/policies/:type/sections/:sectionId (admin) — Delete section */
export async function deletePolicySection(type, sectionId) {
  const res = await apiClient.delete(`/policies/${type}/sections/${sectionId}`);
  return res?.data || res;
}

/** PUT /api/policies/:type/reorder (admin) — Reorder sections */
export async function reorderPolicySections(type, sectionIds) {
  const res = await apiClient.put(`/policies/${type}/reorder`, { sectionIds });
  return res?.data || res;
}
