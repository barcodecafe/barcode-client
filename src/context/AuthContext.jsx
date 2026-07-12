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
  useEffect(() => {
    authService.getCurrentUser().then((current) => {
      setUser(current);
      setIsLoaded(true);
    });
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

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isRegistered,
    isAdmin: user?.role === 'admin',
    isAuthLoaded: isLoaded,
    login,
    register,
    registerRider,
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
