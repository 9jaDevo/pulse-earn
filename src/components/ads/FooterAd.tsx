import React from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';

export const FooterAd: React.FC = () => {
  const { profile } = useAuth();
  const footerSlot = import.meta.env.VITE_ADSENSE_FOOTER_SLOT;

  // Don't show ads for admin and ambassador users
  if (!footerSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

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