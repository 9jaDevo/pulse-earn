import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { isPWAInstallable, showInstallPrompt } from '../../utils/pwaUtils';
import { isWebView } from '../../utils/webviewDetector';

export const InstallPWAButton: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    // Don't show the prompt in WebView environments
    if (isWebView()) {
      return;
    }
    
    // Check if the app is installable
    const installable = isPWAInstallable();
    setCanInstall(installable);
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if the app was successfully installed
    window.addEventListener('appinstalled', () => {
      // Hide the install button
      setCanInstall(false);
      setDeferredPrompt(null);
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
      setCanInstall(false);
    }
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="text-gray-400 hover:text-white flex items-center space-x-1 transition-colors"
      aria-label="Install App"
    >
      <Download className="h-4 w-4" />
      <span className="text-sm">Install App</span>
    </button>
  );
};