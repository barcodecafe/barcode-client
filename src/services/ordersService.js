// ---------------------------------------------------------------------------
// ordersService.js — LIVE BACKEND
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/orders (admin: all) */
export async function getAllOrders() {
  try {
    const res = await apiClient.get('/orders');
    
    // 🎯 ব্যাকএন্ড res.data.data অথবা res.data হিসেবে ডাটা পাঠাচ্ছে, তা নিখুঁতভাবে আনপ্যাক করা হচ্ছে:
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    if (res && Array.isArray(res.orders)) return res.orders;
    
    return [];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}

/** 
 * ⚡ GET /api/orders/pending-count (admin) 
 */
export async function getPendingOrderCount() {
  try {
    const response = await apiClient.get('/orders/pending-count');
    
    if (!response) {
      return { pendingCount: 0 };
    }

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

/** GET /api/orders/:id */
export async function getOrderById(id) {
  const res = await apiClient.get(`/orders/${id}`);
  return res?.data || res;
}

/** GET /api/orders?active=true */
export async function getActiveOrdersForUser(userId) {
  const q = userId ? `?userId=${userId}&active=true` : '?active=true';
  const res = await apiClient.get(`/orders${q}`);
  return res?.data || res;
}

/** POST /api/orders */
export async function createOrder(orderData) {
  const payload = {
    items: (orderData.items || []).map((i) => ({
      id: i.id,
      quantity: i.quantity,
      selectedSize: i.selectedSize ?? i.selectedVariation ?? null,
      price: i.price,
      originalPrice: i.originalPrice || i.price,
      offerType: i.offerType || null,
    })),
    regionId: orderData.regionId,
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
  const res = await apiClient.patch(`/orders/${id}/status`, { status: newStatus });
  return res?.data || res;
}

/** POST /api/orders/:id/assign-rider (admin) */
export async function assignRiderToOrder(orderId, riderId) {
  const res = await apiClient.post(`/orders/${orderId}/assign-rider`, { riderId });
  return res?.data || res;
}

/** POST /api/orders/:id/accept-rider (rider) */
export async function acceptRiderOrder(orderId) {
  const res = await apiClient.post(`/orders/${orderId}/accept-rider`, {});
  return res?.data || res;
}

/** POST /api/orders/:id/reject-rider (rider) */
export async function rejectRiderOrder(orderId) {
  const res = await apiClient.post(`/orders/${orderId}/reject-rider`, {});
  return res?.data || res;
}

/** POST /api/orders/:id/messages */
export async function addChatMessage(id, message) {
  const res = await apiClient.post(`/orders/${id}/messages`, { text: message.text });
  return res?.data || res;
}

/** POST /api/orders/submit-daily-cash (rider) */
export async function submitRiderDailyCash(dateString) {
  const res = await apiClient.post('/orders/submit-daily-cash', { date: dateString });
  return res?.data || res;
}

/** POST /api/orders/confirm-cash-settlement (admin) */
export async function confirmRiderCashSettlement(riderId, dateString) {
  const res = await apiClient.post('/orders/confirm-cash-settlement', { riderId, date: dateString });
  return res?.data || res;
}