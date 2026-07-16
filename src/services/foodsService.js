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
  return applyFoodDiscount(getActivePrice(food, branchId, selectedSize), food);
}

// ── Discount helpers — percentage OR flat ৳ amount (single source of truth) ──
// A food discounts either by a percentage (discountPct) or a flat ৳ amount per
// unit (discountAmount), chosen by discountType ('percent' default for legacy).

/** true if the food currently has any active discount. */
export function hasFoodDiscount(food) {
  if (!food) return false;
  return food.discountType === 'flat'
    ? (Number(food.discountAmount) || 0) > 0
    : (Number(food.discountPct) || 0) > 0;
}

/** Apply the food's discount to an already-computed active price (never below 0). */
export function applyFoodDiscount(activePrice, food) {
  const p = Number(activePrice) || 0;
  if (!food) return p;
  if (food.discountType === 'flat') {
    const amt = Number(food.discountAmount) || 0;
    return amt > 0 ? Math.max(0, p - amt) : p;
  }
  const pct = Number(food.discountPct) || 0;
  return pct > 0 ? p * (1 - pct / 100) : p;
}

/** Badge text for the discount, e.g. "20% OFF" or "৳50 OFF" (null if none). */
export function foodDiscountLabel(food) {
  if (!food) return null;
  if (food.discountType === 'flat') {
    const a = Number(food.discountAmount) || 0;
    return a > 0 ? `৳${a} OFF` : null;
  }
  const pct = Number(food.discountPct) || 0;
  return pct > 0 ? `${pct}% OFF` : null;
}
