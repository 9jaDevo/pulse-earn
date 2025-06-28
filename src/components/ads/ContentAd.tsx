import React, { useState, useEffect } from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsService } from '../../services/settingsService';

interface ContentAdProps {
  layout?: 'in-article' | 'in-feed' | 'display';
  className?: string;
}

export const ContentAd: React.FC<ContentAdProps> = ({ 
  layout = 'in-article',
  className = ''
}) => {
  const { profile } = useAuth();
  const [contentSlot, setContentSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load ad slot from settings
  useEffect(() => {
    const loadAdSettings = async () => {
      try {
        const { data } = await SettingsService.getSettings('integrations');
        
        if (data) {
          setContentSlot(data.adsenseContentSlot || null);
        } else {
          // Fallback to environment variable if settings not available
          setContentSlot(import.meta.env.VITE_ADSENSE_CONTENT_SLOT || null);
        }
      } catch (err) {
        console.error('Error loading ad settings:', err);
        // Fallback to environment variable
        setContentSlot(import.meta.env.VITE_ADSENSE_CONTENT_SLOT || null);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdSettings();
  }, []);

  // Don't show ads for admin and ambassador users
  if (loading || !contentSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

  return (
    <AdContainer position="content" className={className}>
      <AdSenseAd
        slot={contentSlot}
        layout={layout}
        responsive={true}
        style={{
          minHeight: '200px'
        }}
      />
    </AdContainer>
  );
};