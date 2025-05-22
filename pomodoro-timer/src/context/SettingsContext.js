import React, { createContext, useState, useEffect, useContext } from 'react';
import { isAuthenticated } from '../services/authService';
import { settingsApi } from '../services/apiService';

// Default settings
const DEFAULT_SETTINGS = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartNextSession: false,
  tickingSound: false,
  completionSound: true,
  notifications: true,
  volume: 50,
  selectedSound: 'bell',
};

// Create the context
const SettingsContext = createContext();

// Custom hook to use the settings context
export const useSettings = () => useContext(SettingsContext);

// Provider component
export const SettingsProvider = ({ children }) => {
  // Settings state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isAuthenticated()) {
          console.log('SettingsContext: Loading settings from API...');
          // Load settings from API if authenticated
          const userSettings = await settingsApi.getSettings();

          console.log('SettingsContext: Received settings from API:', userSettings);

          if (userSettings) {
            const mergedSettings = {
              ...DEFAULT_SETTINGS,
              ...userSettings,
            };

            console.log('SettingsContext: Merged settings:', mergedSettings);
            setSettings(mergedSettings);
          } else {
            console.log('SettingsContext: No settings received from API, using defaults');
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          console.log('SettingsContext: User not authenticated, loading from localStorage');
          // Load settings from localStorage if not authenticated
          const storedSettings = localStorage.getItem('pomodoroSettings');

          if (storedSettings) {
            try {
              const parsedSettings = JSON.parse(storedSettings);
              console.log('SettingsContext: Loaded settings from localStorage:', parsedSettings);

              setSettings({
                ...DEFAULT_SETTINGS,
                ...parsedSettings,
              });
            } catch (parseError) {
              console.error('SettingsContext: Error parsing localStorage settings:', parseError);
              setSettings(DEFAULT_SETTINGS);
            }
          } else {
            console.log('SettingsContext: No settings in localStorage, using defaults');
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } catch (error) {
        console.error('SettingsContext: Error loading settings:', error);
        setError('Failed to load settings');

        // Fall back to localStorage if API fails
        console.log('SettingsContext: Falling back to localStorage due to API error');
        const storedSettings = localStorage.getItem('pomodoroSettings');

        if (storedSettings) {
          try {
            const parsedSettings = JSON.parse(storedSettings);
            console.log('SettingsContext: Loaded fallback settings from localStorage:', parsedSettings);

            setSettings({
              ...DEFAULT_SETTINGS,
              ...parsedSettings,
            });
          } catch (parseError) {
            console.error('SettingsContext: Error parsing localStorage settings:', parseError);
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          console.log('SettingsContext: No fallback settings in localStorage, using defaults');
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async (newSettings) => {
    setIsLoading(true);
    setError(null);

    try {
      // Merge with existing settings
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };

      console.log('SettingsContext: Saving updated settings:', updatedSettings);

      if (isAuthenticated()) {
        console.log('SettingsContext: User authenticated, saving to API');
        // Save settings to API if authenticated
        try {
          const response = await settingsApi.updateSettings(updatedSettings);
          console.log('SettingsContext: Settings saved to API successfully:', response);
        } catch (apiError) {
          console.error('SettingsContext: Error saving to API:', apiError);
          setError('Failed to save settings to server');
          // Continue to save to localStorage even if API fails
        }
      } else {
        console.log('SettingsContext: User not authenticated, saving to localStorage only');
      }

      // Always save to localStorage as a fallback
      localStorage.setItem('pomodoroSettings', JSON.stringify(updatedSettings));
      console.log('SettingsContext: Settings saved to localStorage');

      // Update state
      setSettings(updatedSettings);

      // Dispatch a custom event to notify other components that settings have changed
      const event = new CustomEvent('settingsChanged', {
        detail: { settings: updatedSettings }
      });
      window.dispatchEvent(event);
      console.log('SettingsContext: Dispatched settingsChanged event');

    } catch (error) {
      console.error('SettingsContext: Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('SettingsContext: Resetting settings to defaults:', DEFAULT_SETTINGS);

      if (isAuthenticated()) {
        console.log('SettingsContext: User authenticated, resetting settings in API');
        // Reset settings in API if authenticated
        try {
          const response = await settingsApi.updateSettings(DEFAULT_SETTINGS);
          console.log('SettingsContext: Settings reset in API successfully:', response);
        } catch (apiError) {
          console.error('SettingsContext: Error resetting settings in API:', apiError);
          setError('Failed to reset settings on server');
          // Continue to reset localStorage even if API fails
        }
      } else {
        console.log('SettingsContext: User not authenticated, resetting localStorage only');
      }

      // Reset settings in localStorage
      localStorage.setItem('pomodoroSettings', JSON.stringify(DEFAULT_SETTINGS));
      console.log('SettingsContext: Settings reset in localStorage');

      // Update state
      setSettings(DEFAULT_SETTINGS);

      // Dispatch a custom event to notify other components that settings have changed
      const event = new CustomEvent('settingsChanged', {
        detail: { settings: DEFAULT_SETTINGS }
      });
      window.dispatchEvent(event);
      console.log('SettingsContext: Dispatched settingsChanged event for reset');

    } catch (error) {
      console.error('SettingsContext: Error resetting settings:', error);
      setError('Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reload settings (used after login)
  const reloadSettings = async () => {
    console.log('SettingsContext: Reloading settings after login...');
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated()) {
        console.log('SettingsContext: Loading settings from API after login...');
        // Load settings from API if authenticated
        const userSettings = await settingsApi.getSettings();

        console.log('SettingsContext: Received settings from API after login:', userSettings);

        if (userSettings) {
          const mergedSettings = {
            ...DEFAULT_SETTINGS,
            ...userSettings,
          };

          console.log('SettingsContext: Merged settings after login:', mergedSettings);
          setSettings(mergedSettings);

          // Dispatch a custom event to notify other components that settings have changed
          const event = new CustomEvent('settingsChanged', {
            detail: { settings: mergedSettings }
          });
          window.dispatchEvent(event);
          console.log('SettingsContext: Dispatched settingsChanged event after login');
        } else {
          console.log('SettingsContext: No settings received from API after login, using defaults');
          setSettings(DEFAULT_SETTINGS);
        }
      }
    } catch (error) {
      console.error('SettingsContext: Error reloading settings after login:', error);
      setError('Failed to reload settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the context value
  const contextValue = {
    settings,
    isLoading,
    error,
    saveSettings,
    resetSettings,
    reloadSettings, // Add the new function to the context
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
