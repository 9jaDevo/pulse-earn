import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to manage ad refresh based on page navigation
 * Refreshes ads every 3 page visits to show new ads in SPA
 */
export const useAdRefresh = () => {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    // Get current visit count from sessionStorage
    const currentVisits = parseInt(sessionStorage.getItem('adVisitCount') || '0');
    const newVisitCount = currentVisits + 1;
    
    setVisitCount(newVisitCount);
    sessionStorage.setItem('adVisitCount', newVisitCount.toString());

    // Refresh ads every 3 page visits
    if (newVisitCount % 3 === 0) {
      setRefreshKey(prev => prev + 1);
      
      // Clear existing ads to force refresh
      setTimeout(() => {
        const adElements = document.querySelectorAll('.adsbygoogle');
        adElements.forEach(ad => {
          if (ad.innerHTML) {
            // Mark for refresh
            ad.setAttribute('data-adsbygoogle-status', '');
          }
        });
      }, 100);
    }
  }, [location.pathname]);

  return { refreshKey, visitCount };
};