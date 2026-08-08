import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as settingsService from '../services/settingsService';
import { DEFAULT_SETTINGS } from '../services/settingsService';

const SettingsContext = createContext(null);

// Async-safe (audit N12): start from DEFAULT_SETTINGS so Footer/logo render
// sensible values immediately, then hydrate from the API. update/reset await
// the server and store the returned object — never a pending Promise.
export const SettingsProvider = ({ children }) => {
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // .catch/.finally: without them a failed settings request left
    // isSettingsLoaded false forever, and anything gated on it never rendered.
    settingsService
      .getSettings()
      .then((s) => setSettingsState(s || DEFAULT_SETTINGS))
      .catch((err) => console.error('Failed to load site settings:', err))
      .finally(() => setIsLoaded(true));
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    const updated = await settingsService.saveSettings(newSettings);
    setSettingsState(updated);
    return updated;
  }, []);

  const resetSettings = useCallback(async () => {
    const reset = await settingsService.resetSettings();
    setSettingsState(reset);
    return reset;
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
