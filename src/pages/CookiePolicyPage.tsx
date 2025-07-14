import React from 'react';
import { ArrowLeft, Cookie, Shield, Settings, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center mb-4">
            <Cookie className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Cookie Policy</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit our website. 
              They are widely used to make websites work more efficiently and to provide information to website owners.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              At PollPeak, we use cookies to enhance your experience, analyze site usage, and provide personalized content.
            </p>
          </section>

          {/* Types of Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Types of Cookies We Use</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Essential Cookies</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  These cookies are necessary for the website to function properly. They enable core functionality 
                  such as security, network management, and accessibility. You cannot opt-out of these cookies.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>• Authentication and session management</li>
                  <li>• Security and fraud prevention</li>
                  <li>• Load balancing and performance optimization</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics Cookies</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  These cookies help us understand how visitors interact with our website by collecting and 
                  reporting information anonymously. This helps us improve our site's performance.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>• Page views and user behavior tracking</li>
                  <li>• Performance monitoring</li>
                  <li>• Error tracking and debugging</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Settings className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Functional Cookies</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  These cookies enable enhanced functionality and personalization. They may be set by us or by 
                  third-party providers whose services we have added to our pages.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <li>• User preferences and settings</li>
                  <li>• Theme selection (dark/light mode)</li>
                  <li>• Language preferences</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cookie Management */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Managing Your Cookie Preferences</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights 
              by setting your preferences in the cookie consent banner when you first visit our site.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Browser Settings</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                You can also control cookies through your browser settings:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• <strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li>• <strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li>• <strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li>• <strong>Edge:</strong> Settings → Privacy → Cookies</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Important Note</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please note that if you disable cookies, some features of our website may not function properly, 
                and your user experience may be affected.
              </p>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Updates to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for 
              other operational, legal, or regulatory reasons.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              We encourage you to review this policy periodically to stay informed about our use of cookies.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about this Cookie Policy, please contact us:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Email: <a href="mailto:privacy@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@pollpeak.com</a>
              </p>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Or visit our <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Page</Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
