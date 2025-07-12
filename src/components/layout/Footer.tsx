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

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/polls" className="text-gray-400 hover:text-white transition-colors">Polls</Link></li>
              <li><Link to="/trivia" className="text-gray-400 hover:text-white transition-colors">Trivia Games</Link></li>
              <li><Link to="/leaderboard" className="text-gray-400 hover:text-white transition-colors">Leaderboard</Link></li>
              <li><Link to="/rewards" className="text-gray-400 hover:text-white transition-colors">Daily Rewards</Link></li>
              <li><Link to="/ambassador" className="text-gray-400 hover:text-white transition-colors">Ambassador Program</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Terms of Service
                </Link>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR Compliance</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Data Protection</a></li>
            </ul>
          </div>
          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Report Issue</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bug Bounty</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} {generalSettings.platformName || "PollPeak"}. All rights reserved. Built for the community, by the community.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                to="/privacy-policy" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Privacy
              </Link>
              <Link 
                to="/terms-of-service" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Terms
              </Link>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Accessibility</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};