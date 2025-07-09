import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingsService } from '../services/settingsService';
import { useToast } from '../hooks/useToast';

interface GeneralSettings {
  platformName: string;
  platformDescription: string;
  defaultLanguage: string;
  defaultTheme: 'light' | 'dark' | 'system';
  allowThemeSelection: boolean;
  logoUrl: string;
  faviconUrl: string;
  seoKeywords: string;
  ogImageUrl: string;
  marketingEnabled: boolean;
}

interface SettingsContextType {
  generalSettings: GeneralSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateDocumentMetadata: () => void;
}

const defaultGeneralSettings: GeneralSettings = {
  platformName: 'PulseEarn',
  platformDescription: 'Community-powered platform for polls, trivia, and rewards',
  defaultLanguage: 'en',
  defaultTheme: 'system',
  allowThemeSelection: true,
  logoUrl: '/assets/logo.png',
  faviconUrl: '/assets/favicon.ico',
  seoKeywords: 'polls, trivia, rewards, community, earning, games',
  ogImageUrl: '',
  marketingEnabled: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { errorToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch general settings
      const { data: generalData, error: generalError } = await SettingsService.getSettings('general');
      
      if (generalError) {
        setError(generalError);
        errorToast(`Failed to load general settings: ${generalError}`);
        return;
      }
      
      // Fetch marketing settings
      const { data: marketingData, error: marketingError } = await SettingsService.getSettings('marketing');
      
      if (marketingError) {
        console.warn('Failed to load marketing settings:', marketingError);
        // Continue with default marketing settings
      }
      
      // Merge all settings
      setGeneralSettings({
        ...defaultGeneralSettings,
        ...(generalData || {}),
        marketingEnabled: marketingData?.is_enabled !== undefined ? marketingData.is_enabled : true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update document title, meta tags, and favicon based on settings
  const updateDocumentMetadata = () => {
    // Update document title
    document.title = generalSettings.platformName 
      ? `${generalSettings.platformName} - Community Platform for Polls, Trivia & Rewards` 
      : 'PulseEarn - Community Platform for Polls, Trivia & Rewards';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', generalSettings.platformDescription || defaultGeneralSettings.platformDescription);
    }
    
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', generalSettings.seoKeywords || defaultGeneralSettings.seoKeywords);
    
    // Update Open Graph title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${generalSettings.platformName || 'PulseEarn'} - Earn Through Community Engagement`);
    
    // Update Open Graph description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', generalSettings.platformDescription || defaultGeneralSettings.platformDescription);
    
    // Update Open Graph image if provided
    if (generalSettings.ogImageUrl) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', generalSettings.ogImageUrl);
    }
    
    // Update favicon
    const faviconLink = document.querySelector('link[rel="icon"]');
    if (faviconLink && generalSettings.faviconUrl) {
      faviconLink.setAttribute('href', generalSettings.faviconUrl);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update document metadata when settings change
  useEffect(() => {
    if (!loading) {
      updateDocumentMetadata();
    }
  }, [generalSettings, loading]);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ 
      generalSettings, 
      loading, 
      error, 
      refreshSettings,
      updateDocumentMetadata
    }}>
      {children}
    </SettingsContext.Provider>
  );
};