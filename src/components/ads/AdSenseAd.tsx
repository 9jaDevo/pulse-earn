import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

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
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;

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

  useEffect(() => {
    if (!clientId || !slot) return;

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
  }, [clientId, slot, adKey]);

  if (!clientId || !slot) {
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
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={getDataAdFormat()}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        data-ad-layout={layout !== 'display' ? layout : undefined}
        key={adKey}
      />
    </div>
  );
};