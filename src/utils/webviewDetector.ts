/**
 * Utility to detect if the application is running in a WebView
 */

/**
 * Checks if the current environment is a WebView
 * 
 * This function examines the User-Agent string for common WebView identifiers
 * such as those used in Android and iOS WebViews.
 * 
 * @returns boolean - true if running in a WebView, false otherwise
 */
export const isWebView = (): boolean => {
  // Get the user agent string
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Common WebView identifiers
  const webViewIdentifiers = [
    'wv', // Android WebView
    'webview',
    'fban', // Facebook app
    'fbav', // Facebook app
    'instagram',
    'line',
    'miuibrowser', // Xiaomi browser
    'samsungbrowser', // Samsung browser in WebView mode
    'naver', // Naver app
    'kakaotalk', // KakaoTalk
    'electron' // Electron apps
  ];
  
  // Check for iOS WebView
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
  
  // Check for Android WebView
  const hasWebViewIdentifier = webViewIdentifiers.some(identifier => 
    userAgent.includes(identifier)
  );
  
  // Additional check for Android WebView
  const isAndroidWebView = /Android.*Version\/[0-9]/.test(navigator.userAgent) && 
                          !userAgent.includes('chrome');
  
  return isIOSWebView || hasWebViewIdentifier || isAndroidWebView;
};

/**
 * Checks if the app is running as an installed PWA
 * 
 * @returns boolean - true if running as an installed PWA, false otherwise
 */
export const isInstalledPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export default {
  isWebView,
  isInstalledPWA
};