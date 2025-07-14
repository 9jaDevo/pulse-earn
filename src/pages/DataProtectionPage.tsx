import React from 'react';
import { ArrowLeft, Shield, Lock, Server, Eye, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DataProtectionPage: React.FC = () => {
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
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Data Protection</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Our comprehensive approach to protecting your personal data
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Commitment to Data Protection</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              At PollPeak, we take data protection seriously. Your privacy and security are fundamental to our platform. 
              This page outlines our comprehensive approach to protecting your personal data through technical, 
              organizational, and legal measures.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              We have implemented industry-standard security measures and follow best practices to ensure your data 
              remains secure, private, and under your control.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How We Collect and Use Your Data</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Registration</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  When you create an account, we collect:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Email address (for authentication and communication)</li>
                  <li>• Display name (for profile identification)</li>
                  <li>• Country/region (for localized content)</li>
                  <li>• Password (encrypted and never stored in plain text)</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Eye className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Usage Analytics</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  To improve our platform, we collect anonymized usage data:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Page views and navigation patterns</li>
                  <li>• Feature usage statistics</li>
                  <li>• Performance metrics</li>
                  <li>• Error logs (anonymized)</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Server className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Platform Activity</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Your interactions with our platform are recorded for functionality:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Poll votes and trivia responses</li>
                  <li>• Points earned and rewards claimed</li>
                  <li>• Comments and user-generated content</li>
                  <li>• Referral activities</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Security Measures */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Security Measures</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Technical Safeguards</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                  <li>• <strong>Authentication:</strong> Multi-factor authentication support and secure password policies</li>
                  <li>• <strong>Access Controls:</strong> Role-based access control with principle of least privilege</li>
                  <li>• <strong>Network Security:</strong> Firewalls, intrusion detection, and DDoS protection</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Organizational Measures</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Staff Training:</strong> Regular security awareness and data protection training</li>
                  <li>• <strong>Access Management:</strong> Strict access controls and regular access reviews</li>
                  <li>• <strong>Incident Response:</strong> Comprehensive data breach response procedures</li>
                  <li>• <strong>Compliance Monitoring:</strong> Regular audits and compliance assessments</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Infrastructure Security</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Cloud Security:</strong> SOC 2 Type II certified cloud infrastructure</li>
                  <li>• <strong>Backup & Recovery:</strong> Regular backups with tested disaster recovery procedures</li>
                  <li>• <strong>Monitoring:</strong> 24/7 security monitoring and threat detection</li>
                  <li>• <strong>Updates:</strong> Regular security patches and system updates</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Sharing and Third Parties</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We are committed to protecting your data and only share it in limited circumstances:
            </p>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Service Providers</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  We work with trusted service providers who help us deliver our platform:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Cloud hosting and infrastructure providers</li>
                  <li>• Analytics and performance monitoring services</li>
                  <li>• Payment processors (for premium features)</li>
                  <li>• Customer support tools</li>
                </ul>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  All service providers are bound by strict data processing agreements and security requirements.
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Legal Requirements</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We may disclose your data if required by law, court order, or to protect our rights and the 
                  safety of our users. We will notify you of such requests unless legally prohibited.
                </p>
              </div>
            </div>
          </section>

          {/* Your Control */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Control Over Your Data</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You have full control over your personal data. Here's how you can manage it:
            </p>
            
            <div className="grid gap-4">
              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Account Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Update your profile information, change your password, and manage your preferences anytime.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Data Export</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Request a copy of all your data in a machine-readable format through your account settings.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Account Deletion</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Delete your account and all associated data permanently. This action cannot be undone.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Questions or Concerns?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about our data protection practices or need assistance with your data rights:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Email</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    <a href="mailto:privacy@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      privacy@pollpeak.com
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Contact Form</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Submit a privacy inquiry
                    </Link>
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Related Pages</h3>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                      Privacy Policy
                    </Link>
                    <span className="text-gray-400">•</span>
                    <Link to="/gdpr-compliance" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                      GDPR Compliance
                    </Link>
                    <span className="text-gray-400">•</span>
                    <Link to="/cookies" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                      Cookie Policy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
