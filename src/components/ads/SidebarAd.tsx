import React from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';

export const SidebarAd: React.FC = () => {
  const { profile } = useAuth();
  const sidebarSlot = import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT;

  // Don't show ads for admin and ambassador users
  if (!sidebarSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

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