import React from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';
import { useState, useEffect } from 'react';

export const HeaderAd: React.FC = () => {
  const { profile } = useAuth();
  const [headerSlot, setHeaderSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load ad slot from settings
  useEffect(() => {
    const loadAdSettings = async () => {
      try {
        const { data } = await SettingsService.getSettings('integrations');
        
        if (data) {
          setHeaderSlot(data.adsenseHeaderSlot || null);
        } else {
          // Fallback to environment variable if settings not available
          setHeaderSlot(import.meta.env.VITE_ADSENSE_HEADER_SLOT || null);
        }
      } catch (err) {
        console.error('Error loading ad settings:', err);
        // Fallback to environment variable
        setHeaderSlot(import.meta.env.VITE_ADSENSE_HEADER_SLOT || null);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdSettings();
  }, []);

  // Don't show ads for admin and ambassador users
  if (loading || !headerSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

  return (
    <AdContainer position="header" className="hidden md:block max-h-[90px] overflow-hidden">
      <AdSenseAd
        slot={headerSlot}
        format="horizontal"
        style={{
          width: '728px',
          height: '90px',
          maxHeight: '90px',
          maxWidth: '100%'
        }}
        responsive={true}
      />
    </AdContainer>
  );
};