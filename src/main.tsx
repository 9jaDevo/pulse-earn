import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { isWebView } from './utils/webviewDetector';
import './index.css';

// Prevent PWA install prompt in WebView environments
if (isWebView()) {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Don't show the install prompt
    return false;
  });
}

// Register service worker for PWA functionality (only in supported environments)
if ('serviceWorker' in navigator && !window.location.hostname.includes('webcontainer')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
} else if (window.location.hostname.includes('webcontainer')) {
  console.info('Service Workers are not supported in this environment (WebContainer/StackBlitz)');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);