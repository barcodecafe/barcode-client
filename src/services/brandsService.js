// ---------------------------------------------------------------------------
// brandsService.js — LIVE BACKEND
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** Helper to strictly extract data payload */
const extractData = (res) => {
  if (!res) return [];
  if (res.data && res.data.data) return res.data.data;
  if (res.data) return res.data;
  return res;
};

/** GET /api/brands — public listing (active brands, ordered) */
export async function getAllBrands() {
  try {
    const response = await apiClient.get('/brands');
    return extractData(response);
  } catch (error) {
    console.error("Error fetching public brands:", error);
    throw error;
  }
}

/** GET /api/brands?all=true — admin listing including hidden brands */
export async function getAllBrandsAdmin() {
  try {
    const response = await apiClient.get('/brands?all=true');
    return extractData(response);
  } catch (error) {
    console.error("Error fetching admin brands:", error);
    throw error;
  }
}

/** GET /api/brands/slug/:slug — a single brand for its microsite */
export async function getBrandBySlug(slug) {
  try {
    const response = await apiClient.get(`/brands/slug/${encodeURIComponent(slug)}`);
    return extractData(response);
  } catch (error) {
    console.error(`Error fetching brand with slug ${slug}:`, error);
    throw error;
  }
}

/** GET /api/brands/slug/:slug/branches — { brand, branches } for the microsite */
export async function getBrandBranches(slug) {
  try {
    const response = await apiClient.get(`/brands/slug/${encodeURIComponent(slug)}/branches`);
    return extractData(response);
  } catch (error) {
    console.error(`Error fetching branches for brand ${slug}:`, error);
    throw error;
  }
}

/** GET /api/brands/slug/:slug/menu — { brand, foods } served at the brand's branches */
export async function getBrandMenu(slug) {
  try {
    const response = await apiClient.get(`/brands/slug/${encodeURIComponent(slug)}/menu`);
    return extractData(response);
  } catch (error) {
    console.error(`Error fetching menu for brand ${slug}:`, error);
    throw error;
  }
}

/** POST /api/brands (admin) */
export async function createBrand(brand) {
  try {
    const response = await apiClient.post('/brands', brand);
    return extractData(response);
  } catch (error) {
    console.error("Error creating brand:", error);
    throw error;
  }
}

/** PATCH /api/brands/:id (admin) */
export async function updateBrand(id, updatedFields) {
  try {
    const response = await apiClient.patch(`/brands/${id}`, updatedFields);
    return extractData(response);
  } catch (error) {
    console.error(`Error updating brand ${id}:`, error);
    throw error;
  }
}

/** PUT /api/brands/reorder (admin) — Live Server-এ ব্র্যান্ড অর্ডার সেভ করার জন্য */
export async function updateBrandOrder(orderedBrandIds) {
  try {
    // 🎯 নিশ্চিত করুন শুধুমাত্র Pure ID (Number/String) অ্যারে পাঠানো হচ্ছে
    const cleanIds = (orderedBrandIds || []).map((item) => {
      if (typeof item === "object" && item !== null) return item.id ?? item._id;
      return item;
    }).filter(Boolean);

    const response = await apiClient.put('/brands/reorder', { 
      brandIds: cleanIds,
      orderedIds: cleanIds,
      ids: cleanIds
    });
    
    return response?.data ?? response;
  } catch (error) {
    console.error("Error updating brand order:", error);
    throw error;
  }
}

/** DELETE /api/brands/:id (admin) */
export async function deleteBrand(id) {
  try {
    const response = await apiClient.delete(`/brands/${id}`);
    return extractData(response);
  } catch (error) {
    console.error(`Error deleting brand ${id}:`, error);
    throw error;
  }
}