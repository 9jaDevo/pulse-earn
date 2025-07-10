import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { isPWAInstallable, showInstallPrompt } from '../../utils/pwaUtils';
import { isWebView } from '../../utils/webviewDetector';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    // Don't show the prompt in WebView environments
    if (isWebView()) {
      return;
    }
    
    // Check if the app is installable
    const installable = isPWAInstallable();
    
    if (!installable) {
      return;
    }
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if the app was successfully installed
    window.addEventListener('appinstalled', () => {
      // Hide the prompt
      setShowPrompt(false);
      // Clear the saved prompt
      setDeferredPrompt(null);
      // Log the installation
      console.log('PWA was installed');
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    const installed = await showInstallPrompt(deferredPrompt);
    if (installed) {
      setDeferredPrompt(null);
    }
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    // Store in localStorage to prevent showing again for a while
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };
  
  if (!showPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 animate-slide-up">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="flex items-start space-x-3">
        <div className="bg-primary-100 p-2 rounded-lg">
          <img src="/assets/icon-192.webp" alt="PollPeak" className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Install PollPeak</h3>
          <p className="text-sm text-gray-600 mt-1 mb-3">
            Install our app for a better experience with offline access and faster loading.
          </p>
          <button
            onClick={handleInstallClick}
            className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-primary-600 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
};