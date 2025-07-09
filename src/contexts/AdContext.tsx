import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingsService } from '../services/settingsService';

interface AdContextType {
  adsEnabled: boolean;
  adsenseClientId: string | null;
  adSlots: {
    header: string | null;
    footer: string | null;
    sidebar: string | null;
    content: string | null;
    mobile: string | null;
  };
  loading: boolean;
  refreshAds: () => void;
}

const AdContext = createContext<AdContextType | undefined>(undefined);

export const useAds = (): AdContextType => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
};

export const AdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);
  const [adsenseClientId, setAdsenseClientId] = useState<string | null>(null);
  const [adSlots, setAdSlots] = useState<{
    header: string | null;
    footer: string | null;
    sidebar: string | null;
    content: string | null;
    mobile: string | null;
  }>({
    header: null,
    footer: null,
    sidebar: null,
    content: null,
    mobile: null
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadAdSettings = async () => {
    setLoading(true);
    try {
      // Only try to load settings if Supabase is properly configured
      let data = null;
      try {
        const result = await SettingsService.getSettings('integrations');
        data = result.data;
      } catch (error) {
        console.warn('Could not load ad settings from database, using environment variables:', error);
      }
      
      if (data) {
        setAdsEnabled(data.adsenseEnabled !== false);
        setAdsenseClientId(data.adsenseClientId || null);
        setAdSlots({
          header: data.adsenseHeaderSlot || null,
          footer: data.adsenseFooterSlot || null,
          sidebar: data.adsenseSidebarSlot || null,
          content: data.adsenseContentSlot || null,
          mobile: data.adsenseMobileSlot || null
        });
      } else {
        // Fallback to environment variables
        const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
        
        // Check if client ID is a placeholder or empty
        const isValidClientId = clientId && 
          clientId !== 'ca-pub-xxxxxxxxxxxxxxxxxx' && 
          clientId.startsWith('ca-pub-') &&
          !clientId.includes('placeholder');
        
        setAdsenseClientId(isValidClientId ? clientId : null);
        
        if (!isValidClientId && clientId) {
          console.warn('[AdSense] Invalid or placeholder client ID detected. Please update VITE_ADSENSE_CLIENT_ID in .env with your actual AdSense publisher ID.');
        }
        
        setAdSlots({
          header: import.meta.env.VITE_ADSENSE_HEADER_SLOT || null,
          footer: import.meta.env.VITE_ADSENSE_FOOTER_SLOT || null,
          sidebar: import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || null,
          content: import.meta.env.VITE_ADSENSE_CONTENT_SLOT || null,
          mobile: import.meta.env.VITE_ADSENSE_MOBILE_SLOT || null
        });
      }
    } catch (err) {
      console.error('Error loading ad settings:', err);
      // Fallback to environment variables
      const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
      
      // Check if client ID is a placeholder or empty
      const isValidClientId = clientId && 
        clientId !== 'ca-pub-xxxxxxxxxxxxxxxxxx' && 
        clientId.startsWith('ca-pub-') &&
        !clientId.includes('placeholder');
      
      setAdsenseClientId(isValidClientId ? clientId : null);
      
      setAdSlots({
        header: import.meta.env.VITE_ADSENSE_HEADER_SLOT || null,
        footer: import.meta.env.VITE_ADSENSE_FOOTER_SLOT || null,
        sidebar: import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || null,
        content: import.meta.env.VITE_ADSENSE_CONTENT_SLOT || null,
        mobile: import.meta.env.VITE_ADSENSE_MOBILE_SLOT || null
      });
    } finally {
      setLoading(false);
    }
  };

  // Load ad settings on mount
  useEffect(() => {
    loadAdSettings();
  }, []);

  // Function to refresh ad settings
  const refreshAds = () => {
    loadAdSettings();
  };

  return (
    <AdContext.Provider value={{ 
      adsEnabled, 
      adsenseClientId, 
      adSlots, 
      loading,
      refreshAds
    }}>
      {children}
    </AdContext.Provider>
  );
};