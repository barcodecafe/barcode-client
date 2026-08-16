import apiClient from './apiClient';

/** GET /api/addons — Fetch all add-on groups with their items */
export async function getAllAddonGroups() {
  const res = await apiClient.get('/addons');
  return Array.isArray(res) ? res : res?.data || [];
}
export const getAllAddons = getAllAddonGroups;

/** POST /api/addons — Create a new add-on group with items */
export async function createAddonGroup(payload) {
  const res = await apiClient.post('/addons', payload);
  return res?.data || res;
}
export const createAddon = createAddonGroup;

/** PATCH /api/addons/:id — Update an add-on group (title, items) */
export async function updateAddonGroup(id, payload) {
  const res = await apiClient.patch(`/addons/${id}`, payload);
  return res?.data || res;
}
export const updateAddon = updateAddonGroup;

/** DELETE /api/addons/:id — Delete an add-on group */
export async function deleteAddonGroup(id) {
  const res = await apiClient.delete(`/addons/${id}`);
  return res?.data || res;
}
export const deleteAddon = deleteAddonGroup;

/** POST /api/addons/seed-defaults — Populate sample burger add-on groups (Extra Cheese, Premium Add-ons) */
export async function seedDefaultAddons() {
  const res = await apiClient.post('/addons/seed-defaults', {});
  return Array.isArray(res) ? res : res?.data || [];
}
