import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram, Mail } from 'lucide-react';
import { FooterAd } from '../ads/FooterAd';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSettings } from '../../contexts/SettingsContext';
import { InstallPWAButton } from '../ui/InstallPWAButton';

export const Footer: React.FC = () => {
  const { generalSettings } = useSettings();
  
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      {/* Footer Ad */}
      <FooterAd />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {generalSettings.logoUrl ? (
                <img 
                  src={generalSettings.logoUrl} 
                  alt={generalSettings.platformName || "PollPeak"} 
                  className="h-10 w-auto"
                />
              ) : (
                <>
                  <div className="p-2 rounded-lg">
                    <img src="/assets/PollPeak.png" alt="PollPeak" className="h-8 w-auto" />
                  </div>
                  <span className="text-xl font-bold">{generalSettings.platformName || "PollPeak"}</span>
                </>
              )}
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              {generalSettings.platformDescription || 
                "Join our community-powered platform for interactive polls, engaging trivia, and rewarding experiences. Earn points, climb leaderboards, and turn your participation into real rewards."}
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              {generalSettings.allowThemeSelection !== false && (
                <ThemeToggle className="ml-2" />
              )}
            </div>
            <div className="mt-4">
              <InstallPWAButton />
            </div>
          </div>
                    <a href="/cookie-policy" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
                    <a href="/gdpr-compliance" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <li><Link to="/trivia" className="text-gray-400 hover:text-white transition-colors">Trivia Games</Link></li>
              <li><Link to="/leaderboard" className="text-gray-400 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link to="/rewards" className="text-gray-400 hover:text-white transition-colors">Daily Rewards</Link></li>
              <li><Link to="/ambassador" className="text-gray-400 hover:text-white transition-colors">Ambassador Program</Link></li>
                    <a href="/data-protection" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy-policy" 
                    <a href="/help-center" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Privacy Policy
                </Link>
                    <a href="/community-guidelines" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <li>
                <Link 
                  to="/terms-of-service" 
                  className="text-gray-400 hover:text-white transition-colors"
                    <a href="/contact" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                >
                  Terms of Service
                </Link>
              </li>
                    <a href="/report-issue" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR Compliance</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Data Protection</a></li>
            </ul>
          </div>
                    <a href="/bug-bounty" className="text-base text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Report Issue</a></li>
              <a href="https://twitter.com/pollpeak" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <a href="https://facebook.com/pollpeak" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            <p>&copy; {new Date().getFullYear()} {generalSettings.platformName || "PollPeak"}. All rights reserved. Built for the community, by the community.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy-policy" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
              <a href="https://instagram.com/pollpeak" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
              >
                Privacy
              </Link>
              <Link 
                to="/terms-of-service" 
              <a href="mailto:support@pollpeak.com" className="text-gray-400 hover:text-gray-500">
              <a href="/cookie-policy" className="text-gray-400 hover:text-gray-500 text-sm">
              >
                Terms
              <a href="/accessibility" className="text-gray-400 hover:text-gray-500 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};