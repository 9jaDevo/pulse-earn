import React, { useState, useEffect } from 'react';
import { X, Info, Check, Settings } from 'lucide-react';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentChoice = localStorage.getItem('cookie_consent');
    if (!consentChoice) {
      // Only show banner if no choice has been made
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
    
    // Enable analytics and non-essential cookies here
    // For example: initializeAnalytics();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
    
    // Disable non-essential cookies here
    // For example: disableAnalytics();
  };

  const handleManagePreferences = () => {
    setShowDetails(!showDetails);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200 p-4 md:p-6 animate-slide-up">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="flex items-start space-x-3 mb-4 md:mb-0 md:pr-8">
            <Info className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Cookie Consent</h3>
              <p className="text-gray-600 text-sm">
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
              
              {showDetails && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Cookie Types</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Essential:</span> 
                      <span className="text-gray-600">Required for basic website functionality. Always active.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Analytics:</span> 
                      <span className="text-gray-600">Help us understand how visitors interact with our website.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">Marketing:</span> 
                      <span className="text-gray-600">Used to deliver relevant ads and track their performance.</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4">
                    <a href="/privacy-policy" className="text-primary-600 hover:text-primary-700 text-sm">
                      View our Privacy Policy
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleManagePreferences}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-1"
            >
              <Settings className="h-4 w-4" />
              <span>{showDetails ? 'Hide Details' : 'Manage Preferences'}</span>
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Decline All
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
            >
              <Check className="h-4 w-4" />
              <span>Accept All</span>
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};