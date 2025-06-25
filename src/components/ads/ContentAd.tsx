import React from 'react';
import { AdSenseAd } from './AdSenseAd';
import { AdContainer } from './AdContainer';
import { useAuth } from '../../contexts/AuthContext';

interface ContentAdProps {
  layout?: 'in-article' | 'in-feed' | 'display';
  className?: string;
}

export const ContentAd: React.FC<ContentAdProps> = ({ 
  layout = 'in-article',
  className = ''
}) => {
  const { profile } = useAuth();
  const contentSlot = import.meta.env.VITE_ADSENSE_CONTENT_SLOT;

  // Don't show ads for admin and ambassador users
  if (!contentSlot || profile?.role === 'admin' || profile?.role === 'ambassador') return null;

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