import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SettingsService } from '../../services/settingsService';

interface AdSenseAdProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
  layout?: 'in-article' | 'in-feed' | 'display';
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdSenseAd: React.FC<AdSenseAdProps> = ({
  slot,
  format = 'auto',
  style = {},
  className = '',
  responsive = true,
  layout = 'display'
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [adKey, setAdKey] = useState(0);
  const [pageVisits, setPageVisits] = useState(0);
  const [adsenseClientId, setAdsenseClientId] = useState<string | null>(null);
  const [adsenseEnabled, setAdsenseEnabled] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load AdSense settings from database
  useEffect(() => {
    const loadAdSenseSettings = async () => {
      try {
        const { data, error } = await SettingsService.getSettings('integrations');
        
        if (error || !data) {
          console.warn('Failed to load AdSense settings:', error);
          return;
        }
        
        setAdsenseClientId(data.adsenseClientId || null);
        setAdsenseEnabled(data.adsenseEnabled !== false); // Default to true if not explicitly set to false
      } catch (err) {
        console.error('Error loading AdSense settings:', err);
      }
    };
    
    loadAdSenseSettings();
  }, []);

  // Dynamically load AdSense script when settings are available
  useEffect(() => {
    if (adsenseEnabled && adsenseClientId && !scriptLoaded) {
      // Check if script is already loaded
      const existingScript = document.querySelector(`script[src*="adsbygoogle.js"]`);
      if (existingScript) {
        setScriptLoaded(true);
        return;
      }
      
      // Create and append the script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        setScriptLoaded(true);
        console.log('AdSense script loaded successfully');
      };
      
      script.onerror = (error) => {
        console.error('Error loading AdSense script:', error);
      };
      
      document.head.appendChild(script);
    }
  }, [adsenseEnabled, adsenseClientId, scriptLoaded]);

  // Track page visits for ad refresh
  useEffect(() => {
    const visits = parseInt(sessionStorage.getItem('pageVisits') || '0') + 1;
    setPageVisits(visits);
    sessionStorage.setItem('pageVisits', visits.toString());

    // Refresh ads every 3 page visits
    if (visits % 3 === 0) {
      setAdKey(prev => prev + 1);
    }
  }, [location.pathname]);

  // Initialize ad when settings and script are ready
  useEffect(() => {
    if (!adsenseEnabled || !adsenseClientId || !scriptLoaded || !slot) return;

    const loadAd = () => {
      try {
        if (window.adsbygoogle && adRef.current) {
          // Clear previous ad
          const adElement = adRef.current.querySelector('ins');
          if (adElement && adElement.innerHTML) {
            return; // Ad already loaded
          }

          // Push new ad
          window.adsbygoogle.push({});
        }
      } catch (error) {
        console.warn('AdSense error:', error);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAd, 100);
    return () => clearTimeout(timer);
  }, [adsenseEnabled, adsenseClientId, scriptLoaded, slot, adKey]);

  // Don't render anything if AdSense is disabled or client ID is missing
  if (!adsenseEnabled || !adsenseClientId) {
    return null;
  }

  const getAdStyle = () => {
    const baseStyle: React.CSSProperties = {
      display: 'block',
      textAlign: 'center',
      margin: '20px auto',
      ...style
    };

    if (layout === 'in-article') {
      return {
        ...baseStyle,
        margin: '30px auto',
        maxWidth: '100%'
      };
    }

    if (layout === 'in-feed') {
      return {
        ...baseStyle,
        margin: '20px 0',
        width: '100%'
      };
    }

    return baseStyle;
  };

  const getDataAdFormat = () => {
    if (responsive) return 'auto';
    return format;
  };

  return (
    <div 
      ref={adRef}
      className={`adsense-container ${className}`}
      style={{ 
        minHeight: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ins
        className="adsbygoogle"
        style={getAdStyle()}
        data-ad-client={adsenseClientId}
        data-ad-slot={slot}
        data-ad-format={getDataAdFormat()}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        data-ad-layout={layout !== 'display' ? layout : undefined}
        key={adKey}
      />
    </div>
  );
};