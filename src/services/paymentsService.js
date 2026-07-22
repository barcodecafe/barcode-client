// ---------------------------------------------------------------------------
// paymentsService.js — SSLCommerz online payment
//
// The customer never types card details into our site: we ask the server for a
// payment session and hand the browser over to SSLCommerz's hosted page. The
// server settles the order from the gateway's verified callback.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

// SSLCommerz rejects anything under this for our store ("Transaction amount is
// not allowed as per admin configuration"), so smaller orders stay cash-only.
export const MIN_ONLINE_AMOUNT = 100;

/** POST /api/payments/init → { gatewayUrl, tranId, isDemo } */
export async function initPayment(orderId) {
  return apiClient.post('/payments/init', { orderId });
}

/** GET /api/payments/status/:orderId → { paymentStatus, paymentMethod, transactionId } */
export async function getPaymentStatus(orderId) {
  return apiClient.get(`/payments/status/${orderId}`);
}

/**
 * POST /api/payments/recheck/:orderId (admin) → { changed, paymentStatus, reason }
 *
 * Asks the gateway what actually happened and settles the order if it confirms
 * the payment. This is the recovery path for orders whose callback never
 * arrived — it can only ever settle a payment the gateway itself vouches for.
 */
export async function recheckPayment(orderId) {
  return apiClient.post(`/payments/recheck/${orderId}`);
}

/**
 * Absolute API origin — needed when the browser must be *navigated* to a server
 * route (the gateway return URLs) rather than fetched from it.
 */
export function apiBaseUrl() {
  const base = import.meta.env?.VITE_API_BASE_URL || '/api';
  return base.startsWith('http') ? base : `${window.location.origin}${base}`;
}
