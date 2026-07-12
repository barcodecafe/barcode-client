// ---------------------------------------------------------------------------
// foodsService.js — LIVE BACKEND
//
// Menu/food data now comes from the API. The pure pricing HELPERS
// (getActivePrice / getDiscountedPrice) stay client-side — they operate on a
// food object the API already returns (branchPrices keyed by branch id).
// ---------------------------------------------------------------------------
import apiClient from './apiClient';


/** GET /api/foods */
export async function getAllFoods() {
  return apiClient.get('/foods');
}

/** GET /api/foods?category=Mains */
export async function getFoodsByCategory(category) {
  if (!category || category === 'All') return apiClient.get('/foods');
  return apiClient.get(`/foods?category=${encodeURIComponent(category)}`);
}

/** GET /api/foods/:id */
export async function getFoodById(id) {
  return apiClient.get(`/foods/${id}`);
}

/** GET /api/foods/popular?limit=6 */
export async function getPopularFoods(limit = 6) {
  return apiClient.get(`/foods/popular?limit=${limit}`);
}

/** GET /api/branches/:branchId/menu (falls back to all foods for branchId 0/none) */
export async function getFoodsByBranch(branchId) {
  if (!branchId || Number(branchId) === 0) return apiClient.get('/foods');
  return apiClient.get(`/branches/${Number(branchId)}/menu`);
}

/** GET /api/foods/search?q=... */
export async function searchFoods(query) {
  const q = (query || '').trim();
  if (!q) return [];
  return apiClient.get(`/foods/search?q=${encodeURIComponent(q)}`);
}

/** POST /api/foods (admin) */
export async function createFood(food) {
  return apiClient.post('/foods', food);
}

/** PATCH /api/foods/:id (admin) */
export async function updateFood(id, updatedFields) {
  return apiClient.patch(`/foods/${id}`, updatedFields);
}

/** DELETE /api/foods/:id (admin) */
export async function deleteFood(id) {
  return apiClient.delete(`/foods/${id}`);
}


// ── Pure client-side display helpers (unchanged — operate on a food object) ──

export function getActivePrice(food, branchId, selectedSize = null) {
  if (!food) return 0;
  let basePrice = food.price;
  if (selectedSize && food.variations && food.variations.length > 0) {
    const variation = food.variations.find((v) => v.name === selectedSize);
    if (variation) basePrice = variation.price;
  }
  let adjustment = 0;
  if (branchId && food.branchPrices && food.branchPrices[branchId] !== undefined) {
    adjustment = Number(food.branchPrices[branchId]) || 0;
  }
  return basePrice + adjustment;
}

export function getDiscountedPrice(food, branchId, selectedSize = null) {
  if (!food) return 0;
  const basePrice = getActivePrice(food, branchId, selectedSize);
  if (food.discountPct > 0) return basePrice * (1 - food.discountPct / 100);
  return basePrice;
}
