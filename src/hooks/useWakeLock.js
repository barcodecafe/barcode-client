import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 📱 useWakeLock Hook
 * Keeps the mobile / tablet / desktop screen awake and prevents screen lock / sleep mode
 * while the admin is logged in and managing restaurant operations.
 */
export const useWakeLock = (enabled = true) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }
    try {
      if (!wakeLockRef.current || wakeLockRef.current.released) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setIsLocked(true);
        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false);
        });
      }
      return true;
    } catch (err) {
      // Browsers may fail if battery is ultra-low or tab is not active yet
      setIsLocked(false);
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        // ignore
      }
      wakeLockRef.current = null;
    }
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isSupported) {
      releaseWakeLock();
      return undefined;
    }

    requestWakeLock();

    // Re-acquire wake lock when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestWakeLock();
      }
    };

    // Re-acquire on user touch/click if released by system
    const handleUserGesture = () => {
      if (enabled && (!wakeLockRef.current || wakeLockRef.current.released)) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    window.addEventListener('click', handleUserGesture, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('touchstart', handleUserGesture);
      window.removeEventListener('click', handleUserGesture);
      releaseWakeLock();
    };
  }, [enabled, isSupported, requestWakeLock, releaseWakeLock]);

  return { isSupported, isLocked, requestWakeLock, releaseWakeLock };
};
