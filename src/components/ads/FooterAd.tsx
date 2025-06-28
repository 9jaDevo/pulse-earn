import React, { useState, useEffect } from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';

export const FooterAd: React.FC = () => {
  const { profile } = useAuth();
  const [footerSlot, setFooterSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load ad slot from settings
  useEffect(() => {
    const loadAdSettings = async () => {
      try {
        const { data } = await SettingsService.getSettings('integrations');
        
        if (data) {
          setFooterSlot(data.adsenseFooterSlot || null);
        } else {
          // Fallback to environment variable if settings not available
          setFooterSlot(import.meta.env.VITE_ADSENSE_FOOTER_SLOT || null);
        }
      } catch (err) {
        console.error('Error loading ad settings:', err);
        // Fallback to environment variable
        setFooterSlot(import.meta.env.VITE_ADSENSE_FOOTER_SLOT || null);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdSettings();
  }, []);

  // Don't show ads for admin and ambassador users
  if (loading || !footerSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

  return (
    <AdContainer position="footer">
      <AdSenseAd
        slot={footerSlot}
        format="rectangle"
        style={{
          width: '300px',
          height: '250px',
          maxWidth: '100%'
        }}
        responsive={true}
      />
    </AdContainer>
  );
};