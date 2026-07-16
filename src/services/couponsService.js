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

// ── Coupon discount helpers — percentage OR flat ৳ amount ──
/** The ৳ discount a coupon gives on a subtotal (flat is capped at the subtotal). */
export function couponDiscountAmount(subtotal, coupon) {
  if (!coupon) return 0;
  const st = Number(subtotal) || 0;
  if (coupon.discountType === 'flat') return Math.min(Number(coupon.discountAmount) || 0, st);
  return (st * (Number(coupon.discountPct) || 0)) / 100;
}

/** Badge text for a coupon's discount, e.g. "20% OFF" or "৳50 OFF". */
export function couponDiscountLabel(coupon) {
  if (!coupon) return '';
  if (coupon.discountType === 'flat') return `৳${Number(coupon.discountAmount) || 0} OFF`;
  return `${Number(coupon.discountPct) || 0}% OFF`;
}
