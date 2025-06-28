import React, { useState, useEffect } from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';

export const SidebarAd: React.FC = () => {
  const { profile } = useAuth();
  const [sidebarSlot, setSidebarSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load ad slot from settings
  useEffect(() => {
    const loadAdSettings = async () => {
      try {
        const { data } = await SettingsService.getSettings('integrations');
        
        if (data) {
          setSidebarSlot(data.adsenseSidebarSlot || null);
        } else {
          // Fallback to environment variable if settings not available
          setSidebarSlot(import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || null);
        }
      } catch (err) {
        console.error('Error loading ad settings:', err);
        // Fallback to environment variable
        setSidebarSlot(import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || null);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdSettings();
  }, []);

  // Don't show ads for admin and ambassador users
  if (loading || !sidebarSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

  return (
    <AdContainer position="sidebar" className="hidden lg:block">
      <AdSenseAd
        slot={sidebarSlot}
        format="vertical"
        style={{
          width: '300px',
          height: '600px'
        }}
        responsive={true}
      />
    </AdContainer>
  );
};