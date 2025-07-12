import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdProvider } from './contexts/AdContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { Header } from './components/layout/Header';
import { MobileAd } from './components/ads/MobileAd';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import SchemaMarkup from './components/ui/SchemaMarkup';
import { HomePage } from './pages/HomePage';
import { PollsPage } from './pages/PollsPage';
import { TriviaPage } from './pages/TriviaPage';
import { TriviaGamePage } from './pages/TriviaGamePage';
import { DashboardPage } from './pages/DashboardPage';
import { PollDetailsPage } from './pages/PollDetailsPage';
import { RewardsPage } from './pages/RewardsPage';
import { AmbassadorPage } from './pages/AmbassadorPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { useScrollToTop } from './hooks/useScrollToTop';
import { useAuth } from './contexts/AuthContext';
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt';
import { Toaster } from './components/ui/Toast';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';
import { useToast } from './hooks/useToast';
// Main App content component that has access to settings context
const AppContent: React.FC = () => {
  const { generalSettings } = useSettings();
  
  return (
    <>
      <SchemaMarkup 
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": generalSettings.platformName || "PollPeak",
          "url": window.location.origin,
          "description": generalSettings.platformDescription || "Community-powered platform for polls, trivia, daily rewards and earning opportunities",
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${window.location.origin}/polls?search={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        }}
        id="website-schema"
      />
      <SchemaMarkup 
        schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": generalSettings.platformName || "PollPeak",
          "url": window.location.origin,
          "logo": `${window.location.origin}${generalSettings.logoUrl || "/assets/PollPeak.png"}`,
          "sameAs": [
            "https://twitter.com/pollpeak",
            "https://facebook.com/pollpeak",
            "https://instagram.com/pollpeak"
          ]
        }}
        id="organization-schema"
      />
      <AuthProvider>
        <AdProvider>
          <Router>
            <ReferralHandler>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
                <Header />
                <AppDiagnostics />
                <MobileAd />
                <main className="pt-[94px] md:pt-[84px]">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/polls" element={<PollsPage />} />
                   <Route path="/polls/:slug" element={<PollDetailsPage />} />
                    <Route path="/trivia" element={<TriviaPage />} />
                    <Route path="/trivia/game/:gameId" element={
                      <ProtectedRoute>
                        <TriviaGamePage />
                      </ProtectedRoute>
                    } />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/rewards" 
                      element={
                        <ProtectedRoute>
                          <RewardsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/ambassador" 
                      element={
                        <ProtectedRoute requiredRole="ambassador">
                          <AmbassadorPage />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </main>
                <Footer />
                <CookieConsentBanner />
                <PWAInstallPrompt />
              </div>
            </ReferralHandler>
            <Toaster />
          </Router>
        </AdProvider>
      </AuthProvider>
    </>
  );
};

// Component to handle referral codes and payment redirects from URL
const ReferralHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const { successToast, errorToast } = useToast();
  
  // Auto-scroll to top on route changes
  useScrollToTop();
  
  React.useEffect(() => {
    // Handle referral code
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store referral code in sessionStorage for use during signup
      sessionStorage.setItem('referralCode', refCode);
      
      // Remove the ref parameter from URL to clean it up
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // Handle payment redirect from Paystack
    const paymentStatus = searchParams.get('payment_status');
    const transactionId = searchParams.get('transaction_id');
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
    if (paymentStatus === 'success' && (transactionId || reference)) {
      // Show success toast
      successToast('Payment successful! Your poll promotion is pending approval.');
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_status');
      newUrl.searchParams.delete('transaction_id');
      if (reference) {
        newUrl.searchParams.delete('reference');
        newUrl.searchParams.delete('trxref');
      }
      window.history.replaceState({}, '', newUrl.toString());
    } else if (paymentStatus === 'failed' && (transactionId || reference)) {
      // Show error toast
      errorToast('Payment failed. Please try again or contact support.');
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment_status');
      newUrl.searchParams.delete('transaction_id');
      if (reference) {
        newUrl.searchParams.delete('reference');
        newUrl.searchParams.delete('trxref');
      }
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, successToast, errorToast]);
  
  return <>{children}</>;
};

// Diagnostic component to log app state
const AppDiagnostics: React.FC = () => {
  const { user, profile, loading } = useAuth();
  
  React.useEffect(() => {
    console.log('[App] App mounted or auth state changed:', {
      isLoggedIn: !!user,
      userId: user?.id,
      hasProfile: !!profile,
      profileId: profile?.id,
      loading
    });
  }, [user, profile, loading]);
  
  return null;
};

function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;