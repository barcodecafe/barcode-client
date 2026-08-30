import apiClient from './apiClient';

/** GET /api/users/staff */
export async function getStaffUsers() {
  const res = await apiClient.get('/users/staff');
  return res?.data?.data || res?.data || res || [];
}

/** POST /api/users/staff */
export async function createStaffUser(payload) {
  const res = await apiClient.post('/users/staff', payload);
  return res?.data?.data || res?.data || res;
}

/** PATCH /api/users/staff/:id */
export async function updateStaffUser(id, payload) {
  const res = await apiClient.patch(`/users/staff/${id}`, payload);
  return res?.data?.data || res?.data || res;
}

/** DELETE /api/users/staff/:id */
export async function deleteStaffUser(id) {
  const res = await apiClient.delete(`/users/staff/${id}`);
  return res?.data || res;
}
