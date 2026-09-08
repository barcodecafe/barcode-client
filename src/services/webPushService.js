import { apiClient } from './apiClient';

/**
 * Helper to convert Base64 VAPID key to Uint8Array for browser PushManager
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 📲 Register Service Worker for Background Web Push
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * 🔔 Subscribe user to Web Push Notifications
 */
export async function subscribeUserToPush({ user, vapidPublicKey } = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    // 1. Get or register service worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await registerServiceWorker();
    }
    if (!registration) return null;

    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // 3. Get VAPID public key from backend if not provided
    let pubKey = vapidPublicKey || import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!pubKey) {
      try {
        const res = await apiClient.get('/notifications/vapid-public-key');
        pubKey = res?.publicKey || res?.data?.publicKey || res;
      } catch {
        // Fallback: If backend does not yet serve vapid key endpoint, return registration
        return registration;
      }
    }

    if (!pubKey || typeof pubKey !== 'string') {
      return registration;
    }

    // 4. Check existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey),
      });
    }

    // 5. Send subscription payload to backend
    if (subscription) {
      try {
        await apiClient.post('/notifications/subscribe', {
          subscription: subscription.toJSON ? subscription.toJSON() : subscription,
          role: user?.role || 'admin',
          userId: user?.id || user?._id,
        });
      } catch (err) {
        console.warn('Failed to send push subscription to server:', err?.message || err);
      }
    }

    return subscription;
  } catch (err) {
    console.warn('Web Push subscription failed:', err);
    return null;
  }
}

/**
 * 🔕 Unsubscribe from push
 */
export async function unsubscribeUserFromPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        try {
          await apiClient.post('/notifications/unsubscribe', {
            endpoint: subscription.endpoint,
          });
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn('Error unsubscribing from push:', err);
  }
}
