import React, { useState } from 'react';
import { Settings, Moon, Sun, Monitor, Check, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeSettingsProps {
  className?: string;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    if (newTheme === 'system') {
      // Remove from localStorage to use system preference
      localStorage.removeItem('theme');
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    } else {
      setTheme(newTheme);
    }
    
    setIsOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Theme settings"
      >
        <Settings className="h-5 w-5" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-slide-up">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Appearance</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="p-3">
            <div className="space-y-2">
              <button
                onClick={() => handleThemeChange('light')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Sun className="h-5 w-5 text-warning-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Light</span>
                </div>
                {theme === 'light' && (
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Moon className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Dark</span>
                </div>
                {theme === 'dark' && (
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <Monitor className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">System</span>
                </div>
                {!localStorage.getItem('theme') && (
                  <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};