import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as favoritesService from '../services/favoritesService';
import { useAuth } from './AuthContext';

// ---------------------------------------------------------------------------
// FavoritesContext.jsx
//
// Global "Saved to Favorites" state for the heart icon on food cards.
// Lives at the same level as CartContext so the favorited state is
// consistent no matter which page renders the card (Home, Menu, etc.).
//
// Persistence today: localStorage, via favoritesService.js.
// Persistence later: swap the body of favoritesService's functions for
// real POST/DELETE calls — this file does not need to change, since it
// only ever calls the service layer, never localStorage directly.
// ---------------------------------------------------------------------------

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Re-hydrate whenever the logged-in user changes (audit #23/N13 fix): each
  // account has its own server-side favorites, and logging out clears them —
  // no more one shared list bleeding across accounts on the same browser.
  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    favoritesService.getFavorites().then((ids) => {
      setFavoriteIds(ids);
      setIsLoaded(true);
    });
  }, [user]);

  const isFavorite = useCallback(
    (foodId) => favoriteIds.includes(foodId),
    [favoriteIds]
  );

  // Optimistic toggle: update UI immediately, sync to the service layer in
  // the background. If the backend call fails once it's real, this is the
  // spot to revert `favoriteIds` on error.
  const toggleFavorite = useCallback(
    (foodId) => {
      const wasFav = favoriteIds.includes(foodId);
      // optimistic
      setFavoriteIds((prev) =>
        wasFav ? prev.filter((id) => id !== foodId) : [...prev, foodId]
      );
      const req = wasFav
        ? favoritesService.removeFavorite(foodId)
        : favoritesService.addFavorite(foodId);
      req
        .then((ids) => Array.isArray(ids) && setFavoriteIds(ids)) // reconcile with server truth
        .catch((err) => {
          console.error('Failed to sync favorite, reverting:', err);
          setFavoriteIds((prev) =>
            wasFav ? [...prev, foodId] : prev.filter((id) => id !== foodId)
          );
        });
    },
    [favoriteIds]
  );

  const value = {
    favoriteIds,
    isFavoritesLoaded: isLoaded,
    isFavorite,
    toggleFavorite,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
