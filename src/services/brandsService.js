// ---------------------------------------------------------------------------
// brandsService.js — LIVE BACKEND
// Brands are the group level above branches: Barcode Café, Omerta, Teheriwala,
// Mezzan Haile Aaiun, Bir Chattala, Barcode Sweets. A branch belongs to a brand
// (branch.brandId), and each brand has its own /brands/:slug microsite.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/brands — public listing (active brands, ordered) */
export async function getAllBrands() {
  return apiClient.get('/brands');
}

/** GET /api/brands?all=true — admin listing including hidden brands */
export async function getAllBrandsAdmin() {
  return apiClient.get('/brands?all=true');
}

/** GET /api/brands/slug/:slug — a single brand for its microsite */
export async function getBrandBySlug(slug) {
  return apiClient.get(`/brands/slug/${encodeURIComponent(slug)}`);
}

/** POST /api/brands (admin) */
export async function createBrand(brand) {
  return apiClient.post('/brands', brand);
}

/** PATCH /api/brands/:id (admin) */
export async function updateBrand(id, updatedFields) {
  return apiClient.patch(`/brands/${id}`, updatedFields);
}

/** DELETE /api/brands/:id (admin) */
export async function deleteBrand(id) {
  return apiClient.delete(`/brands/${id}`);
}
