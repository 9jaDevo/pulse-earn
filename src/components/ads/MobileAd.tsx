import React, { useState, useEffect } from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';

export const MobileAd: React.FC = () => {
  const { profile } = useAuth();
  const [mobileSlot, setMobileSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load ad slot from settings
  useEffect(() => {
    const loadAdSettings = async () => {
      try {
        const { data } = await SettingsService.getSettings('integrations');
        
        if (data) {
          setMobileSlot(data.adsenseMobileSlot || null);
        } else {
          // Fallback to environment variable if settings not available
          setMobileSlot(import.meta.env.VITE_ADSENSE_MOBILE_SLOT || null);
        }
      } catch (err) {
        console.error('Error loading ad settings:', err);
        // Fallback to environment variable
        setMobileSlot(import.meta.env.VITE_ADSENSE_MOBILE_SLOT || null);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdSettings();
  }, []);

  // Don't show ads for admin and ambassador users
  if (loading || !mobileSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

  return (
    <AdContainer position="mobile" className="max-h-[90px] overflow-hidden">
      <AdSenseAd
        slot={mobileSlot}
        format="auto"
        style={{
          width: '320px',
          height: '50px',
          maxHeight: '90px',
          maxWidth: '100%'
        }}
        responsive={true}
      />
    </AdContainer>
  );
};