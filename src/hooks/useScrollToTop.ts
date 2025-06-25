import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to scroll to top on route change
 * 
 * This hook automatically scrolls to the top of the page
 * whenever the route changes, providing a better user experience
 * for navigation between pages.
 */
export const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [location.pathname]);
};

/**
 * Utility function to scroll to top programmatically
 */
export const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior
  });
};

/**
 * Utility function to scroll to a specific element
 */
export const scrollToElement = (elementId: string, behavior: ScrollBehavior = 'smooth') => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior, block: 'start' });
  }
};