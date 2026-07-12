// ---------------------------------------------------------------------------
// searchService.js — LIVE BACKEND
//
// Global navbar search. Now a single call to GET /api/search?q=... which
// returns { foods, branches } already combined server-side. The SearchBar
// component's expected return shape is unchanged.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/**
 * Runs one query against foods + branches.
 * BACKEND: GET /api/search?q=...&limit=5  →  { foods: [...], branches: [...] }
 */
export async function globalSearch(query, { limit = 5 } = {}) {
  const q = query.trim();
  if (!q) return { foods: [], branches: [] };
  return apiClient.get(`/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}
