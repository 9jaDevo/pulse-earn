import React from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';

export const HeaderAd: React.FC = () => {
  const { profile } = useAuth();
  const headerSlot = import.meta.env.VITE_ADSENSE_HEADER_SLOT;

  // Don't show ads for admin and ambassador users
  if (!headerSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

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