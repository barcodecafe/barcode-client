import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';

// ---------------------------------------------------------------------------
// AuthContext.jsx
//
// STATUS: Live. Backed by localStorage via services/authService.js — see
// that file for the full read/write/session contract and the BACKEND notes
// on swapping this for a real API later.
//
// Shape consumed by Navbar.jsx and friends:
//   - user            : the current public user object, or null
//   - isAuthenticated : true once a session exists
//   - isRegistered    : true once *any* account has ever been created on
//                        this device — lets the Navbar show "Log In" instead
//                        of "Sign Up" for a returning-but-logged-out user,
//                        without needing a real backend to ask "has this
//                        person registered before?"
//   - isAdmin         : true when the logged-in user's role is 'admin' —
//                        used to gate the /admin dashboard route
//   - login / register / logout : async actions, see authService.js
// ---------------------------------------------------------------------------

const AuthContext = createContext(null);

const HAS_ACCOUNT_KEY = 'barcode_has_registered_account';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isRegistered, setIsRegistered] = useState(() => {
    // Mirrors authService's own localStorage source of truth, but read
    // synchronously on first render so the Navbar doesn't flash "Sign Up"
    // then "Log In" a moment later for returning visitors.
    try {
      return localStorage.getItem(HAS_ACCOUNT_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate session on mount (page refresh, new tab, etc).
  //
  // getCurrentUser() now rethrows transient failures (rate limit, timeout,
  // network) instead of treating them as "logged out", so this retries a few
  // times before giving up. `isLoaded` is set in every outcome — leaving it
  // false is what pinned ProtectedRoute's spinner on screen indefinitely.
  useEffect(() => {
    let cancelled = false;
    const RETRY_DELAYS_MS = [800, 2500, 6000];

    const hydrate = async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          const current = await authService.getCurrentUser();
          if (!cancelled) setUser(current);
          return;
        } catch (err) {
          if (cancelled) return;
          if (attempt >= RETRY_DELAYS_MS.length) {
            // Out of retries. The token is deliberately left in place: the
            // server never rejected it, we just could not reach it, so a
            // reload once the network recovers restores the session.
            console.error('Could not verify session:', err?.message || err);
            setUser(null);
            return;
          }
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        }
      }
    };

    hydrate().finally(() => {
      if (!cancelled) setIsLoaded(true);
    });

    // apiClient fires this the moment the server actually rejects the token, so
    // the whole app drops to logged-out at once instead of each page finding
    // out separately on its next request.
    const onSessionExpired = () => setUser(null);
    window.addEventListener('auth:session-expired', onSessionExpired);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, []);

  const markRegistered = () => {
    try {
      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
    } catch {
      // localStorage unavailable — isRegistered just won't persist across
      // reloads, which only affects which auth CTA the Navbar defaults to.
    }
    setIsRegistered(true);
  };

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    markRegistered();
    return loggedInUser;
  }, []);

  const register = useCallback(async (details) => {
    const newUser = await authService.register(details);
    setUser(newUser);
    markRegistered();
    return newUser;
  }, []);

  const registerRider = useCallback(async (formData) => {
    const newUser = await authService.registerRider(formData);
    setUser(newUser);
    markRegistered();
    return newUser;
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updated = await authService.updateMe(payload);
    setUser(updated);
    return updated;
  }, []);

  // Re-fetch the current user from the server (e.g. after an order changes the
  // loyalty points balance) so the UI reflects the latest values without a reload.
  const refreshUser = useCallback(async () => {
    const current = await authService.getCurrentUser();
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isRegistered,
    // Matches the server's admin role set (auth.ts ADMIN_ROLES). A strict
    // === 'admin' check locked a super_admin out of /admin entirely, even
    // though the API would have authorised every request they made.
    isAdmin: ['admin', 'super_admin', 'superadmin'].includes(
      String(user?.role || '').toLowerCase(),
    ),
    isAuthLoaded: isLoaded,
    login,
    register,
    registerRider,
    updateProfile,
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
