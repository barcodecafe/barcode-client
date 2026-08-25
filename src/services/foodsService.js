// ---------------------------------------------------------------------------
// foodsService.js — LIVE BACKEND
//
// Menu/food data now comes from the API. The pure pricing HELPERS
// (getActivePrice / getDiscountedPrice) stay client-side — they operate on a
// food object the API already returns (branchPrices keyed by branch id).
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** Helper to filter out inactive foods and sort Sold Out items to the bottom of customer views */
export function processCustomerFoods(foodsList) {
  if (!Array.isArray(foodsList)) return [];
  return foodsList
    .filter((f) => f && f.isActive !== false)
    .sort((a, b) => {
      const availA = a.isAvailable !== false ? 1 : 0;
      const availB = b.isAvailable !== false ? 1 : 0;
      if (availA !== availB) return availB - availA;
      return 0;
    });
}

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
  return apiClient.get(`/foods/${id}?_t=${Date.now()}`);
}

/** GET /api/foods/popular?limit=6 — admin's "Mark as Popular" picks + best sellers */
export async function getPopularFoods(limit = 6) {
  return apiClient.get(`/foods/popular?limit=${limit}`);
}

/** GET /api/foods/featured?limit=6 — only the dishes admin picked for Featured Menu */
export async function getFeaturedFoods(limit = 6) {
  return apiClient.get(`/foods/featured?limit=${limit}`);
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

/** PUT /api/foods/reorder (admin) — Reorder dishes order in Database */
export async function updateFoodOrder(orderedFoodIds) {
  return apiClient.put('/foods/reorder', { foodIds: orderedFoodIds });
}

/** PUT /api/foods/categories/reorder (admin) — Reorder category order in Database */
export async function updateCategoryOrder(orderedCategories) {
  return apiClient.put('/foods/categories/reorder', { categories: orderedCategories });
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

// ── Discount & Offer helpers — percentage OR flat ৳ amount + BOGO Deals + Date Timer ──

/** 🎯 Offer Badge label, e.g. "BUY 1 GET 1 FREE" or "BUY 1 GET 2 FREE" */
export function getFoodOfferLabel(food) {
  if (!food || !food.offerType || food.offerType === 'none') return null;
  if (food.offerType === 'bogo_1g1') return 'BUY 1 GET 1 FREE';
  if (food.offerType === 'bogo_1g2') return 'BUY 1 GET 2 FREE';
  if (food.offerType === 'combo') return 'COMBO DEAL';
  return null;
}

/** 🎯 true if the food currently has an ACTIVE discount based on time range. */
export function hasFoodDiscount(food) {
  if (!food) return false;

  // 🕒 Check Timer/Date Validity
  const now = new Date();
  if (food.discountStartDate && new Date(food.discountStartDate) > now) {
    return false; // Discount hasn't started yet
  }
  if (food.discountEndDate && new Date(food.discountEndDate) < now) {
    return false; // Discount expired
  }

  return food.discountType === 'flat'
    ? (Number(food.discountAmount) || 0) > 0
    : (Number(food.discountPct) || 0) > 0;
}

/** Apply the food's discount to an already-computed active price (never below 0). */
export function applyFoodDiscount(activePrice, food) {
  const p = Number(activePrice) || 0;

  // 🎯 BOGO/Special Offer চালু থাকলে পার্সেন্টেজ বা ফ্ল্যাট ডিসকাউন্ট প্রযোজ্য হবে না
  if (food?.offerType && food.offerType !== 'none') return p;

  if (!food || !hasFoodDiscount(food)) return p; // If discount timer is invalid, return original active price

  if (food.discountType === 'flat') {
    const amt = Number(food.discountAmount) || 0;
    return amt > 0 ? Math.max(0, p - amt) : p;
  }
  const pct = Number(food.discountPct) || 0;
  return pct > 0 ? p * (1 - pct / 100) : p;
}

/** Badge text for the discount, e.g. "20% OFF" or "৳50 OFF" (null if inactive/expired/BOGO). */
export function foodDiscountLabel(food) {
  // 🎯 BOGO Offer থাকলে ডিসকাউন্ট ব্যাজ হাইড থাকবে
  if (food?.offerType && food.offerType !== 'none') return null;

  if (!food || !hasFoodDiscount(food)) return null; // Hide badge if expired or not started

  if (food.discountType === 'flat') {
    const a = Number(food.discountAmount) || 0;
    return a > 0 ? `৳${a} OFF` : null;
  }
  const pct = Number(food.discountPct) || 0;
  return pct > 0 ? `${pct}% OFF` : null;
}

/**
 * 🎯 Parses promo offer text (e.g. "20% OFF", "FLAT ৳50 OFF", "FLAT ৳200 OFF", "100 TK DISCOUNT")
 * into a structured discount object { discountType: 'percent' | 'flat', discountPct, discountAmount }.
 */
export function parseOfferTextToDiscount(offerText) {
  if (!offerText || typeof offerText !== 'string') return null;
  const str = offerText.trim();

  // 1. Percentage check: e.g. "20% OFF", "15% DISCOUNT", "25%"
  const pctMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    if (pct > 0 && pct <= 100) {
      return { discountType: 'percent', discountPct: pct, discountAmount: 0 };
    }
  }

  // 2. Flat Taka cash check: e.g. "FLAT ৳50 OFF", "৳200 OFF", "FLAT 100 TK", "FLAT ৳200", "200 TK OFF", "500৳"
  const flatMatch =
    str.match(/(?:FLAT|SAVE|DISCOUNT)?\s*[৳Tk.]*\s*(\d+(?:\.\d+)?)\s*(?:TK|TAKA|৳)?\s*(?:OFF|DISCOUNT|LESS|ছাড়|ছাড়)?/i);

  if (flatMatch) {
    const amt = parseFloat(flatMatch[1]);
    if (amt > 0) {
      return { discountType: 'flat', discountAmount: amt, discountPct: 0 };
    }
  }

  return null;
}