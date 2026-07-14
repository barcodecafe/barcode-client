// ---------------------------------------------------------------------------
// settingsService.js — LIVE BACKEND (now async — audit N12 fix)
//
// These were synchronous localStorage functions before; they're now async
// API calls. SettingsContext was updated to hydrate via useEffect + a loading
// flag and to await update/reset, so consumers (Footer, logo) never see a
// pending Promise as `settings`.
// ---------------------------------------------------------------------------
import apiClient from './apiClient';

export const DEFAULT_SETTINGS = {
  logoLight: '',
  logoDark: '',
  paymentBanner: '', // <--- 1. Added a default key for the new payment banner.
  footerDescription:
    'Experience the art of modern dining at Barcode. We blend culinary innovation with premium atmospheres across all our branches.',
  footerAddress:
    'Head Office: N. Muhammad Engineering Industries Ltd, 220/250 Paschim Sholoshahar, CDA Avenue, Muradpur, Chattogram-4212',
  footerPhone: '09642-140140',
  footerEmail: 'contact@barcoderestaurant.com',
  footerFacebook: 'https://facebook.com',
  footerInstagram: 'https://instagram.com',
  footerTwitter: 'https://twitter.com',
};

/** GET /api/settings — falls back to defaults if the API is unreachable. */
export async function getSettings() {
  try {
    return await apiClient.get('/settings');
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** PUT /api/settings (admin) — merges the given fields server-side. */
export async function saveSettings(settings) {
  return apiClient.put('/settings', settings);
}

/** POST /api/settings/reset (admin) */
export async function resetSettings() {
  return apiClient.post('/settings/reset');
}
