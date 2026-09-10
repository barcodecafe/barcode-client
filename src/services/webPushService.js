import { apiClient } from './apiClient';

const DEFAULT_VAPID_PUBLIC_KEY =
  'BB11w-AgVYcvEyN-ZE8G_GdNncrZZ4g5zWbErqhBm2h_BOUAgFj4sjiHfgco3QoLkK5ZO7RR2aWduWT96dJP468';

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

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPushPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * 📲 Register Service Worker for Background Web Push
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) {
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
  if (!isPushSupported()) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    // 1. Get or register service worker
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await registerServiceWorker();
    }
    if (!registration) {
      return { success: false, reason: 'no_registration' };
    }

    // 2. Request notification permission (user gesture context is best)
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_not_granted', permission };
    }

    // 3. Get VAPID public key
    let pubKey = vapidPublicKey || import.meta.env?.VITE_VAPID_PUBLIC_KEY;
    if (!pubKey) {
      try {
        const res = await apiClient.get('/notifications/vapid-public-key');
        pubKey = res?.publicKey || res?.data?.publicKey || res;
      } catch {
        pubKey = DEFAULT_VAPID_PUBLIC_KEY;
      }
    }
    if (!pubKey || typeof pubKey !== 'string') {
      pubKey = DEFAULT_VAPID_PUBLIC_KEY;
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
      await apiClient.post('/notifications/subscribe', {
        subscription: subscription.toJSON ? subscription.toJSON() : subscription,
        role: user?.role || 'admin',
        userId: user?.id || user?._id,
      });
    }

    return { success: true, subscription };
  } catch (err) {
    console.error('Web Push subscription failed:', err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * 🚀 Dispatch instant test push to device
 */
export async function sendTestPushNotification({ user } = {}) {
  return await apiClient.post('/notifications/send-test-push', {
    role: user?.role || 'admin',
    userId: user?.id || user?._id,
  });
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
