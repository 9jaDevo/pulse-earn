import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'button' | 'minimal';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  variant = 'icon' 
}) => {
  const { theme, toggleTheme } = useTheme();
  
  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        } ${className}`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="h-4 w-4" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className={`text-current hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${className}`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }
  
  // Default icon variant
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors ${
        theme === 'dark' 
          ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' 
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      } ${className}`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};