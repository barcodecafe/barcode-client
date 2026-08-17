import apiClient from './apiClient';

/** GET /api/categories — Fetch all categories */
export async function getAllCategories() {
  const res = await apiClient.get('/categories');
  return Array.isArray(res) ? res : res?.data || [];
}

/** POST /api/categories — Create a new category */
export async function createCategory(payload) {
  const res = await apiClient.post('/categories', payload);
  return res?.data || res;
}

/** PATCH /api/categories/:id — Update a category (name, order, description, image, isActive) */
export async function updateCategory(id, payload) {
  const res = await apiClient.patch(`/categories/${id}`, payload);
  return res?.data || res;
}

/** DELETE /api/categories/:id — Delete a category (?deleteFoods=true|false) */
export async function deleteCategory(id, deleteFoods = false) {
  const res = await apiClient.delete(`/categories/${id}${deleteFoods ? '?deleteFoods=true' : ''}`);
  return res?.data || res;
}

/** PUT /api/categories/reorder — Reorder categories */
export async function reorderCategories(categories) {
  const res = await apiClient.put('/categories/reorder', { categories });
  return Array.isArray(res) ? res : res?.data || [];
}
