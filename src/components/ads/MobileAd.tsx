import React from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';

export const MobileAd: React.FC = () => {
  const { profile } = useAuth();
  const mobileSlot = import.meta.env.VITE_ADSENSE_MOBILE_SLOT;

  // Don't show ads for admin and ambassador users
  if (!mobileSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

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