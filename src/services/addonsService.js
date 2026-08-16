import apiClient from './apiClient';

/** GET /api/addons — Fetch all centralized add-ons */
export async function getAllAddons(group) {
  const url = group ? `/addons?group=${encodeURIComponent(group)}` : '/addons';
  const res = await apiClient.get(url);
  return res?.data?.data || res?.data || [];
}

/** POST /api/addons — Create new centralized add-on */
export async function createAddon(payload) {
  const res = await apiClient.post('/addons', payload);
  return res?.data?.data || res?.data;
}

/** PATCH /api/addons/:id — Update centralized add-on */
export async function updateAddon(id, payload) {
  const res = await apiClient.patch(`/addons/${id}`, payload);
  return res?.data?.data || res?.data;
}

/** DELETE /api/addons/:id — Delete centralized add-on */
export async function deleteAddon(id) {
  const res = await apiClient.delete(`/addons/${id}`);
  return res?.data?.data || res?.data;
}

/** POST /api/addons/seed-defaults — Reset/seed default burger add-ons */
export async function seedDefaultAddons() {
  const res = await apiClient.post('/addons/seed-defaults', {});
  return res?.data?.data || res?.data || [];
}
