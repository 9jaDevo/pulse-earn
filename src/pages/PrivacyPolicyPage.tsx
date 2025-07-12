import React from 'react';
import { Shield, Eye, Lock, Database, Globe, Mail } from 'lucide-react';
import SchemaMarkup from '../components/ui/SchemaMarkup';

export const PrivacyPolicyPage: React.FC = () => {
  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SchemaMarkup
        schema={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What information do you collect?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We collect personal information that you voluntarily provide to us when you register for an account, participate in polls or trivia games, contact us for support, subscribe to our newsletter, or use our referral program. This information may include your name, email address, country of residence, profile picture, referral codes, and communication preferences."
              }
            },
            {
              "@type": "Question",
              "name": "How do you use my information?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We use your information to provide and maintain our services, process poll votes and trivia responses, calculate points and rewards, manage user accounts and profiles, send important platform updates, respond to support requests, notify about new features, process referral rewards, analyze usage patterns, improve platform performance, develop new features, personalize user experience, comply with legal obligations, prevent fraud and abuse, enforce our terms of service, and protect user safety."
              }
            },
            {
              "@type": "Question",
              "name": "Do you share my information with third parties?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted third-party service providers who assist us in operating our platform, such as hosting, analytics, and customer support services. We may also disclose information if required by law, court order, or government request, or to protect our rights, property, or safety."
              }
            }
          ]
        }}
        id="privacy-policy-schema"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 rounded-2xl">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Policy</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: January 18, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Eye className="h-6 w-6 mr-3 text-primary-600" />
              Introduction
            </h2>
            <p className="text-gray-700 leading-relaxed">
              PulseEarn ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our community platform for polls, trivia, and rewards. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Database className="h-6 w-6 mr-3 text-primary-600" />
              Information We Collect
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <p className="text-gray-700 mb-3">We may collect personal information that you voluntarily provide to us when you:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Register for an account</li>
                  <li>Participate in polls or trivia games</li>
                  <li>Contact us for support</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Use our referral program</li>
                </ul>
                <p className="text-gray-700 mt-3">This information may include:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Name and email address</li>
                  <li>Country of residence</li>
                  <li>Profile picture (optional)</li>
                  <li>Referral codes and relationships</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
                <p className="text-gray-700 mb-3">We automatically collect certain information when you use our platform:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and preferences</li>
                  <li>Poll votes and trivia responses</li>
                  <li>Points earned and rewards claimed</li>
                  <li>Login times and session duration</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Cookies and Tracking Technologies</h3>
                <p className="text-gray-700">
                  We use cookies, web beacons, and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can control cookie settings through your browser preferences.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Lock className="h-6 w-6 mr-3 text-primary-600" />
              How We Use Your Information
            </h2>
            
            <p className="text-gray-700 mb-4">We use the information we collect for the following purposes:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Platform Operations</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Provide and maintain our services</li>
                  <li>• Process poll votes and trivia responses</li>
                  <li>• Calculate points and rewards</li>
                  <li>• Manage user accounts and profiles</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Send important platform updates</li>
                  <li>• Respond to support requests</li>
                  <li>• Notify about new features</li>
                  <li>• Process referral rewards</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Improvement</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Analyze usage patterns</li>
                  <li>• Improve platform performance</li>
                  <li>• Develop new features</li>
                  <li>• Personalize user experience</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Legal Compliance</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Comply with legal obligations</li>
                  <li>• Prevent fraud and abuse</li>
                  <li>• Enforce our terms of service</li>
                  <li>• Protect user safety</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Globe className="h-6 w-6 mr-3 text-primary-600" />
              Information Sharing and Disclosure
            </h2>
            
            <p className="text-gray-700 mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-primary-500 pl-4">
                <h4 className="font-semibold text-gray-900">Service Providers</h4>
                <p className="text-gray-700 text-sm">We may share information with trusted third-party service providers who assist us in operating our platform, such as hosting, analytics, and customer support services.</p>
              </div>
              <div className="border-l-4 border-secondary-500 pl-4">
                <h4 className="font-semibold text-gray-900">Legal Requirements</h4>
                <p className="text-gray-700 text-sm">We may disclose information if required by law, court order, or government request, or to protect our rights, property, or safety.</p>
              </div>
              <div className="border-l-4 border-accent-500 pl-4">
                <h4 className="font-semibold text-gray-900">Business Transfers</h4>
                <p className="text-gray-700 text-sm">In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.</p>
              </div>
              <div className="border-l-4 border-success-500 pl-4">
                <h4 className="font-semibold text-gray-900">Aggregated Data</h4>
                <p className="text-gray-700 text-sm">We may share aggregated, non-personally identifiable information for research, marketing, or analytical purposes.</p>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure hosting infrastructure</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
            <p className="text-gray-700 mb-4">You have the following rights regarding your personal information:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary-900 mb-2">Access and Portability</h4>
                <p className="text-primary-800 text-sm">Request a copy of your personal information and download your data.</p>
              </div>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <h4 className="font-semibold text-secondary-900 mb-2">Correction</h4>
                <p className="text-secondary-800 text-sm">Update or correct inaccurate personal information in your profile.</p>
              </div>
              <div className="bg-accent-50 p-4 rounded-lg">
                <h4 className="font-semibold text-accent-900 mb-2">Deletion</h4>
                <p className="text-accent-800 text-sm">Request deletion of your account and associated personal information.</p>
              </div>
              <div className="bg-success-50 p-4 rounded-lg">
                <h4 className="font-semibold text-success-900 mb-2">Opt-out</h4>
                <p className="text-success-800 text-sm">Unsubscribe from marketing communications and adjust privacy settings.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us using the information provided below. We will respond to your request within 30 days.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700">
              Our platform is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately, and we will take steps to remove such information.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">International Users</h2>
            <p className="text-gray-700">
              If you are accessing our platform from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located. By using our platform, you consent to the transfer of your information to the United States.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the platform after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Mail className="h-6 w-6 mr-3 text-primary-600" />
              Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> privacy@pulselearn.com</p>
              <p><strong>Address:</strong> PulseEarn Privacy Team, 123 Community Street, Digital City, DC 12345</p>
              <p><strong>Response Time:</strong> We aim to respond to all privacy inquiries within 48 hours.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};