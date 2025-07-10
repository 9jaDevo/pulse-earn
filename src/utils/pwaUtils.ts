import { Workbox } from 'workbox-window';

/**
 * Register the service worker for PWA functionality
 * 
 * @returns Promise<ServiceWorkerRegistration | null>
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const wb = new Workbox('/sw.js');
      
      // Add event listeners for service worker updates
      wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.log('New content is available; please refresh.');
          // You could show a notification to the user here
          if (confirm('New version available! Reload to update?')) {
            window.location.reload();
          }
        } else {
          console.log('App is now available offline!');
        }
      });
      
      wb.addEventListener('activated', (event) => {
        if (event.isUpdate) {
          console.log('Service worker has been updated.');
        } else {
          console.log('Service worker has been installed and activated.');
        }
      });
      
      // Register the service worker
      const registration = await wb.register();
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
};

/**
 * Check if the app can be installed (PWA installation criteria met)
 * 
 * @returns boolean
 */
export const isPWAInstallable = (): boolean => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window &&
         !window.matchMedia('(display-mode: standalone)').matches &&
         !(window.navigator as any).standalone;
};

/**
 * Show the PWA installation prompt
 * 
 * @param deferredPrompt The beforeinstallprompt event
 * @returns Promise<boolean> - true if installation was successful
 */
export const showInstallPrompt = async (deferredPrompt: any): Promise<boolean> => {
  if (!deferredPrompt) {
    return false;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  // Return true if the user accepted the installation
  return outcome === 'accepted';
};