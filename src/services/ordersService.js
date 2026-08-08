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
  try {
    const res = await apiClient.get('/orders');
    // 🎯 সেফটি পার্সিং: রেসপন্স অবজেক্টের সব ধরণের নেস্টেড ফরম্যাট হ্যান্ডেল করে সরাসরি অ্যারে রিটার্ন করবে
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.orders)) return res.orders;
    if (res && res.data && Array.isArray(res.data.orders)) return res.data.orders;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}

/** 
 * ⚡ GET /api/orders/pending-count (admin) 
 * ফাস্ট ও লাইটওয়েট পেন্ডিং অর্ডারের সংখ্যা (Count) নিয়ে আসার জন্য
 */
export async function getPendingOrderCount() {
  try {
    const response = await apiClient.get('/orders/pending-count');
    
    if (!response) {
      return { pendingCount: 0 };
    }

    // 🎯 ডিবাগিং ও সেফ এক্সট্রাকশন
    const count = 
      response.pendingCount ?? 
      response.count ?? 
      response.data?.pendingCount ?? 
      response.data?.count ?? 
      (typeof response === "number" ? response : 0);

    return { pendingCount: Number(count) || 0 };
    
  } catch (error) {
    console.error("Error fetching pending count:", error);
    return { pendingCount: 0 };
  }
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
      // 🎯 ফিক্স: ব্রাঞ্চের ফাইনাল অ্যাডজাস্টেড প্রাইস এখানে যুক্ত করা হলো
      price: i.price,
      originalPrice: i.originalPrice || i.price,
      offerType: i.offerType || null,
    })),
    regionId: orderData.regionId,
    // 🎯 ফিক্স: ব্রাঞ্চ আইডি এখানে যুক্ত করা হলো
    branchId: orderData.branchId || Number(localStorage.getItem('selected_branch_id')) || null,
    couponCode: orderData.couponCode || '',
    pointsToRedeem: Math.max(0, Math.floor(Number(orderData.pointsToRedeem) || 0)),
    deliveryArea: orderData.deliveryArea || '',
    deliveryAddress: orderData.deliveryAddress || '',
    deliveryPhone: orderData.deliveryPhone || '',
    paymentMethod: orderData.paymentMethod || 'cod',
  };
  
  const response = await apiClient.post('/orders', payload);
  return response?.data?.data || response?.data || response;
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

/**
 * POST /api/orders/submit-daily-cash (rider)
 * Sends a request to the backend to deposit the cash collected for a specific date added by Sajib khan
 */
export async function submitRiderDailyCash(dateString) {
  return apiClient.post('/orders/submit-daily-cash', { date: dateString });
}

/** POST /api/orders/confirm-cash-settlement (admin) added by Sajib khan */
export async function confirmRiderCashSettlement(riderId, dateString) {
  return apiClient.post('/orders/confirm-cash-settlement', { riderId, date: dateString });
}