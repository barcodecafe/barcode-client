// ---------------------------------------------------------------------------
// analyticsService.js — LIVE BACKEND
// Numbers are now computed from the REAL orders collection server-side
// (audit N5), not from a seeded hash of static data.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/analytics/revenue-by-branch */
export async function getRevenueByBranch() {
  return apiClient.get('/analytics/revenue-by-branch');
}

/** GET /api/analytics/orders-by-category */
export async function getOrdersByCategory() {
  return apiClient.get('/analytics/orders-by-category');
}

/** GET /api/analytics/revenue-trend?months=12 */
export async function getRevenueTrend(months = 12) {
  return apiClient.get(`/analytics/revenue-trend?months=${months}`);
}

/** GET /api/analytics/summary */
export async function getDashboardSummary() {
  return apiClient.get('/analytics/summary');
}

/** GET /api/analytics/top-dishes?limit=5 */
export async function getTopDishes(limit = 5) {
  return apiClient.get(`/analytics/top-dishes?limit=${limit}`);
}

/** GET /api/analytics/top-customers?limit=0 (0 = all customers, ranked by spend) */
export async function getTopCustomers(limit = 0) {
  return apiClient.get(`/analytics/top-customers?limit=${limit}`);
}

/** GET /api/analytics/top-riders?limit=5 — ranked by completed deliveries */
export async function getTopRiders(limit = 5) {
  return apiClient.get(`/analytics/top-riders?limit=${limit}`);
}