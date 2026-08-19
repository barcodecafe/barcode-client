import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as settingsService from '../services/settingsService';
import { DEFAULT_SETTINGS } from '../services/settingsService';
import { socket } from '../services/socket';

const SettingsContext = createContext(null);
const CACHED_SETTINGS_KEY = 'site_settings_cache';

const getInitialSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const cached = localStorage.getItem(CACHED_SETTINGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse cached settings:', err);
  }
  return DEFAULT_SETTINGS;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(getInitialSettings);
  const [isLoaded, setIsLoaded] = useState(true);

  // Sync state to localStorage cache
  const updateLocalCache = (newSettings) => {
    try {
      if (typeof window !== 'undefined' && newSettings) {
        localStorage.setItem(CACHED_SETTINGS_KEY, JSON.stringify(newSettings));
      }
    } catch (err) {
      console.warn('Failed to cache settings:', err);
    }
  };

  useEffect(() => {
    // 1. Initial hydration from backend
    settingsService
      .getSettings()
      .then((s) => {
        if (s) {
          setSettingsState((prev) => {
            // Clean undefined values from s so they don't overwrite valid prev cached values
            const cleanServerSettings = Object.fromEntries(
              Object.entries(s).filter(([_, v]) => v !== undefined && v !== null)
            );
            const merged = { ...DEFAULT_SETTINGS, ...prev, ...cleanServerSettings };
            updateLocalCache(merged);
            return merged;
          });
        }
      })
      .catch((err) => console.error('Failed to load site settings:', err))
      .finally(() => setIsLoaded(true));

    // 2. ⚡ Real-time WebSocket listener for instant zero-latency broadcast
    const handleSettingsUpdated = (incomingSettings) => {
      if (incomingSettings) {
        setSettingsState((prev) => {
          const updated = { ...prev, ...incomingSettings };
          updateLocalCache(updated);
          return updated;
        });
      }
    };

    socket.on('settings_updated', handleSettingsUpdated);
    socket.on('free_delivery_updated', handleSettingsUpdated);

    return () => {
      socket.off('settings_updated', handleSettingsUpdated);
      socket.off('free_delivery_updated', handleSettingsUpdated);
    };
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    // ⚡ Optimistic UI update (Instant 0ms response in Admin and Client UI)
    setSettingsState((prev) => {
      const optimistic = { ...prev, ...newSettings };
      updateLocalCache(optimistic);
      return optimistic;
    });

    try {
      const updated = await settingsService.saveSettings(newSettings);
      if (updated) {
        const merged = { ...DEFAULT_SETTINGS, ...updated };
        setSettingsState(merged);
        updateLocalCache(merged);
        return merged;
      }
    } catch (err) {
      console.error('Failed to save settings to server:', err);
      throw err;
    }
  }, []);

  const resetSettings = useCallback(async () => {
    // ⚡ Optimistic reset
    setSettingsState(DEFAULT_SETTINGS);
    updateLocalCache(DEFAULT_SETTINGS);

    try {
      const reset = await settingsService.resetSettings();
      if (reset) {
        const merged = { ...DEFAULT_SETTINGS, ...reset };
        setSettingsState(merged);
        updateLocalCache(merged);
        return merged;
      }
      return DEFAULT_SETTINGS;
    } catch (err) {
      console.error('Failed to reset settings on server:', err);
      throw err;
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, isSettingsLoaded: isLoaded, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
