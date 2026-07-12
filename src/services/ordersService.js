// ---------------------------------------------------------------------------
// ordersService.js — LIVE BACKEND
//
// Orders now live on the server. The backend RE-COMPUTES price/discount/points
// and owns the canonical status vocabulary, so the client only sends item ids,
// quantities, branch, coupon, points-to-redeem and payment method — never money.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/orders (admin: all) */
export async function getAllOrders() {
  return apiClient.get('/orders');
}

/** GET /api/orders/:id (ownership-checked server-side) */
export async function getOrderById(id) {
  return apiClient.get(`/orders/${id}`);
}

/**
 * GET /api/orders?active=true — the logged-in user's active orders.
 * The server scopes results to the token's user, so the userId argument is
 * only kept for signature compatibility (admins can still pass it).
 * BACKEND excludes Delivered + Rejected from "active" (audit N4 fix).
 */
export async function getActiveOrdersForUser(userId) {
  const q = userId ? `?userId=${userId}&active=true` : '?active=true';
  return apiClient.get(`/orders${q}`);
}

/**
 * POST /api/orders — sends only what the server needs; it computes the rest.
 */
export async function createOrder(orderData) {
  const payload = {
    items: (orderData.items || []).map((i) => ({
      id: i.id,
      quantity: i.quantity,
      selectedSize: i.selectedSize ?? i.selectedVariation ?? null,
    })),
    branchId: orderData.branchId,
    couponCode: orderData.couponCode || '',
    pointsToRedeem: Math.max(0, Math.floor(Number(orderData.pointsToRedeem) || 0)),
    paymentMethod: orderData.paymentMethod || 'cod',
  };
  return apiClient.post('/orders', payload);
}

/** PATCH /api/orders/:id/status (admin/rider) */
export async function updateOrderStatus(id, newStatus) {
  return apiClient.patch(`/orders/${id}/status`, { status: newStatus });
}

/** POST /api/orders/:id/assign-rider (admin) */
export async function assignRiderToOrder(orderId, riderId) {
  return apiClient.post(`/orders/${orderId}/assign-rider`, { riderId });
}

/** POST /api/orders/:id/accept-rider (rider) */
export async function acceptRiderOrder(orderId) {
  return apiClient.post(`/orders/${orderId}/accept-rider`, {});
}

/** POST /api/orders/:id/reject-rider (rider) — auto-reassigns server-side */
export async function rejectRiderOrder(orderId) {
  return apiClient.post(`/orders/${orderId}/reject-rider`, {});
}

/** POST /api/orders/:id/messages — sender/senderName derived server-side */
export async function addChatMessage(id, message) {
  return apiClient.post(`/orders/${id}/messages`, { text: message.text });
}
