import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettings } from './SettingsContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { generalSettings, loading } = useSettings();
  
  // Check if user has a saved theme preference
  const getSavedTheme = (): Theme => {
    // First check localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // If no saved theme and settings are loaded, use the default theme from settings
    if (!loading && generalSettings.defaultTheme && generalSettings.defaultTheme !== 'system') {
      return generalSettings.defaultTheme as Theme;
    }
    
    // Then check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light
    return 'light';
  };

  const [theme, setThemeState] = useState<Theme>(getSavedTheme);

  // Apply theme to document when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Update theme when settings change
  useEffect(() => {
    if (!loading && generalSettings.defaultTheme) {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        if (generalSettings.defaultTheme === 'system') {
          // Use system preference
          const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          setThemeState(isDarkMode ? 'dark' : 'light');
        } else if (generalSettings.defaultTheme === 'light' || generalSettings.defaultTheme === 'dark') {
          setThemeState(generalSettings.defaultTheme);
        }
      }
    }
  }, [generalSettings, loading]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only update if user hasn't explicitly set a preference
      // or if the default theme is set to 'system'
      if (!localStorage.getItem('theme') || 
          (generalSettings.defaultTheme === 'system' && !localStorage.getItem('theme'))) {
        setThemeState(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [generalSettings]);

  const toggleTheme = () => {
    // Only allow toggling if theme selection is enabled in settings
    if (generalSettings.allowThemeSelection !== false) {
      setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }
  };

  const setTheme = (newTheme: Theme) => {
    // Only allow setting if theme selection is enabled in settings
    if (generalSettings.allowThemeSelection !== false) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};