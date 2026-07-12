// ---------------------------------------------------------------------------
// couponsService.js — LIVE BACKEND
// Coupon validation is now re-checked server-side at order time too, so the
// discount can't be tampered with from the client.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/coupons (admin) */
export async function getAllCoupons() {
  return apiClient.get('/coupons');
}

/** POST /api/coupons (admin) */
export async function createCoupon(coupon) {
  return apiClient.post('/coupons', coupon);
}

/** DELETE /api/coupons/:id (admin) */
export async function deleteCoupon(id) {
  return apiClient.delete(`/coupons/${id}`);
}

/** POST /api/coupons/validate { code, subtotal } → coupon (throws with message if invalid) */
export async function validateCoupon(code, subtotal) {
  return apiClient.post('/coupons/validate', { code, subtotal });
}
