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

/** POST /api/coupons/validate { code, subtotal, phone } */
export async function validateCoupon(code, subtotal, phone = '') {
  return apiClient.post('/coupons/validate', { code, subtotal, phone });
}

export function couponDiscountAmount(subtotal, coupon) {
  if (!coupon) return 0;
  const st = Number(subtotal) || 0;
  if (coupon.discountType === 'flat') return Math.min(Number(coupon.discountAmount) || 0, st);
  return (st * (Number(coupon.discountPct) || 0)) / 100;
}

export function couponDiscountLabel(coupon) {
  if (!coupon) return '';
  if (coupon.discountType === 'flat') return `৳${Number(coupon.discountAmount) || 0} OFF`;
  return `${Number(coupon.discountPct) || 0}% OFF`;
}