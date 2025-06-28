import React, { createContext, useContext, useEffect, useState } from 'react';

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
  // Check if user has a saved theme preference
  const getSavedTheme = (): Theme => {
    // First check localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Then check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light
    return 'light';
  };

  const [theme, setThemeState] = useState<Theme>(getSavedTheme);
  const [allowThemeSelection, setAllowThemeSelection] = useState<boolean>(true);

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

  // Load settings after component mounts to avoid context dependency issues
  useEffect(() => {
    const loadSettingsAsync = async () => {
      try {
        // Dynamically import the settings context to avoid circular dependency
        const { useSettings } = await import('./SettingsContext');
        
        // We can't use the hook here, so we'll access settings directly
        // This is a workaround to avoid the context dependency issue
        const settingsModule = await import('../services/settingsService');
        const { data } = await settingsModule.SettingsService.getSettings('general');
        
        if (data) {
          // Update theme selection permission
          if (data.allowThemeSelection !== undefined) {
            setAllowThemeSelection(data.allowThemeSelection);
          }
          
          // Only update theme if user hasn't explicitly set a preference
          if (!localStorage.getItem('theme')) {
            if (data.defaultTheme === 'system') {
              // Use system preference
              const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              setThemeState(isDarkMode ? 'dark' : 'light');
            } else if (data.defaultTheme === 'light' || data.defaultTheme === 'dark') {
              setThemeState(data.defaultTheme);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load theme settings:', error);
        // Continue with default behavior
      }
    };

    loadSettingsAsync();
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only update if user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setThemeState(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    // Only allow toggling if theme selection is enabled in settings
    if (allowThemeSelection) {
      setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }
  };

  const setTheme = (newTheme: Theme) => {
    // Only allow setting if theme selection is enabled in settings
    if (allowThemeSelection) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};