import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/layout/Header';
import { HeaderAd } from './components/ads/HeaderAd';
import { MobileAd } from './components/ads/MobileAd';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
import { Toaster } from './components/ui/Toast';
import { CookieConsentBanner } from './components/layout/CookieConsentBanner';

// Component to handle referral codes from URL
const ReferralHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  
  // Auto-scroll to top on route changes
  useScrollToTop();
  
  React.useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store referral code in sessionStorage for use during signup
      sessionStorage.setItem('referralCode', refCode);
      
      // Remove the ref parameter from URL to clean it up
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);
  
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
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ReferralHandler>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
              <Header />
              <AppDiagnostics />
              <HeaderAd />
              <MobileAd />
              <main className="pt-[164px] md:pt-[154px]">
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
            </div>
          </ReferralHandler>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;