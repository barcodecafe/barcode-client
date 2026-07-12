// ---------------------------------------------------------------------------
// heroSlidesService.js — LIVE BACKEND
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

/** GET /api/hero-slides */
export async function getAllSlides() {
  return apiClient.get('/hero-slides');
}

/** POST /api/hero-slides (admin) */
export async function createSlide(slide) {
  return apiClient.post('/hero-slides', slide);
}

/** PUT /api/hero-slides/:id (admin) */
export async function updateSlide(id, updatedFields) {
  return apiClient.put(`/hero-slides/${id}`, updatedFields);
}

/** DELETE /api/hero-slides/:id (admin) */
export async function deleteSlide(id) {
  return apiClient.delete(`/hero-slides/${id}`);
}
