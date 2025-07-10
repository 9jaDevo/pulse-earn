import React from 'react';
import { FileText, Users, Shield, AlertTriangle, Scale, Gavel } from 'lucide-react';
import SchemaMarkup from '../components/ui/SchemaMarkup';

export const TermsOfServicePage: React.FC = () => {
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
              "name": "What are the Terms of Service?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "These Terms of Service govern your use of the PollPeak platform, website, and services. By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service."
              }
            },
            {
              "@type": "Question",
              "name": "What is the Points and Rewards System?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can earn points through legitimate participation in platform activities including voting in polls (50 points per vote), completing daily trivia challenges (10-30 points based on difficulty), daily login streaks (bonus multipliers), watching advertisements (15 points per ad), and successful referrals (100-150 points). Points can be redeemed for various rewards as available in our reward store. Reward availability and point values may change at our discretion. Points have no cash value and cannot be transferred between accounts."
              }
            },
            {
              "@type": "Question",
              "name": "What is the Ambassador Program?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our Ambassador Program allows eligible users to earn commissions by referring new users to the platform. The commission structure includes Bronze (0-24 referrals): 10% commission, Silver (25-99 referrals): 15% commission, Gold (100-249 referrals): 20% commission, and Platinum (250+ referrals): 25% commission. Ambassador status and commissions are subject to our review and may be revoked for violations of these Terms or fraudulent activity."
              }
            }
          ]
        }}
        id="terms-of-service-schema"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 rounded-2xl">
              <FileText className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Service</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before using our platform. By using PulseEarn, you agree to these terms.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: January 18, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Scale className="h-6 w-6 mr-3 text-primary-600" />
              Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to PulseEarn! These Terms of Service ("Terms") govern your use of the PulseEarn platform, website, and services (collectively, the "Service") operated by PulseEarn ("we," "us," or "our"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Users className="h-6 w-6 mr-3 text-primary-600" />
              Description of Service
            </h2>
            <p className="text-gray-700 mb-4">
              PulseEarn is a community-powered platform that allows users to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary-900 mb-2">Participate in Polls</h4>
                <p className="text-primary-800 text-sm">Vote on community polls and create your own polls on various topics.</p>
              </div>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <h4 className="font-semibold text-secondary-900 mb-2">Play Trivia Games</h4>
                <p className="text-secondary-800 text-sm">Test your knowledge with daily trivia challenges across multiple categories.</p>
              </div>
              <div className="bg-accent-50 p-4 rounded-lg">
                <h4 className="font-semibold text-accent-900 mb-2">Earn Rewards</h4>
                <p className="text-accent-800 text-sm">Accumulate points through participation and redeem them for various rewards.</p>
              </div>
              <div className="bg-success-50 p-4 rounded-lg">
                <h4 className="font-semibold text-success-900 mb-2">Ambassador Program</h4>
                <p className="text-success-800 text-sm">Refer friends and earn commissions through our ambassador program.</p>
              </div>
            </div>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Creation</h3>
                <p className="text-gray-700 mb-3">To use certain features of our Service, you must create an account. You agree to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your password secure and confidential</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Eligibility</h3>
                <p className="text-gray-700">
                  You must be at least 13 years old to create an account. If you are under 18, you represent that you have your parent's or guardian's permission to use the Service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Termination</h3>
                <p className="text-gray-700">
                  You may delete your account at any time. We reserve the right to suspend or terminate accounts that violate these Terms or for any other reason at our sole discretion.
                </p>
              </div>
            </div>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-3 text-primary-600" />
              User Conduct and Prohibited Activities
            </h2>
            <p className="text-gray-700 mb-4">You agree not to engage in any of the following prohibited activities:</p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-error-500 pl-4 bg-error-50 p-3 rounded-r-lg">
                <h4 className="font-semibold text-error-900 mb-2">Content Violations</h4>
                <ul className="text-error-800 text-sm space-y-1">
                  <li>• Post offensive, harmful, or inappropriate content</li>
                  <li>• Share false, misleading, or defamatory information</li>
                  <li>• Violate intellectual property rights</li>
                  <li>• Distribute spam or unsolicited communications</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-warning-500 pl-4 bg-warning-50 p-3 rounded-r-lg">
                <h4 className="font-semibold text-warning-900 mb-2">Platform Abuse</h4>
                <ul className="text-warning-800 text-sm space-y-1">
                  <li>• Create multiple accounts to manipulate voting</li>
                  <li>• Use automated tools or bots</li>
                  <li>• Attempt to hack or compromise the platform</li>
                  <li>• Interfere with other users' experience</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-primary-500 pl-4 bg-primary-50 p-3 rounded-r-lg">
                <h4 className="font-semibold text-primary-900 mb-2">Legal Violations</h4>
                <ul className="text-primary-800 text-sm space-y-1">
                  <li>• Violate any applicable laws or regulations</li>
                  <li>• Engage in fraudulent activities</li>
                  <li>• Harass, threaten, or intimidate other users</li>
                  <li>• Impersonate others or misrepresent your identity</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Points and Rewards */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Points and Rewards System</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Earning Points</h3>
                <p className="text-gray-700 mb-3">You can earn points through legitimate participation in platform activities:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Voting in polls (50 points per vote)</li>
                  <li>Completing daily trivia challenges (10-30 points based on difficulty)</li>
                  <li>Daily login streaks (bonus multipliers)</li>
                  <li>Watching advertisements (15 points per ad)</li>
                  <li>Successful referrals (100-150 points)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Redeeming Rewards</h3>
                <p className="text-gray-700">
                  Points can be redeemed for various rewards as available in our reward store. Reward availability and point values may change at our discretion. Points have no cash value and cannot be transferred between accounts.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Point Forfeiture</h3>
                <p className="text-gray-700">
                  We reserve the right to forfeit points earned through fraudulent means, violation of these Terms, or account termination. Points may also expire after extended periods of inactivity.
                </p>
              </div>
            </div>
          </section>

          {/* Ambassador Program */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ambassador Program</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Our Ambassador Program allows eligible users to earn commissions by referring new users to the platform.
              </p>
              
              <div className="bg-gradient-to-r from-success-50 to-success-100 p-4 rounded-lg">
                <h4 className="font-semibold text-success-900 mb-2">Commission Structure</h4>
                <ul className="text-success-800 text-sm space-y-1">
                  <li>• Bronze (0-24 referrals): 10% commission</li>
                  <li>• Silver (25-99 referrals): 15% commission</li>
                  <li>• Gold (100-249 referrals): 20% commission</li>
                  <li>• Platinum (250+ referrals): 25% commission</li>
                </ul>
              </div>
              
              <p className="text-gray-700">
                Ambassador status and commissions are subject to our review and may be revoked for violations of these Terms or fraudulent activity.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Content</h3>
                <p className="text-gray-700">
                  The Service and its original content, features, and functionality are owned by PulseEarn and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Content</h3>
                <p className="text-gray-700">
                  You retain ownership of content you create (polls, comments, etc.). By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the platform.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy</h2>
            <p className="text-gray-700">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your information.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-3 text-warning-600" />
              Disclaimers and Limitation of Liability
            </h2>
            <div className="space-y-4">
              <div className="bg-warning-50 p-4 rounded-lg border border-warning-200">
                <h4 className="font-semibold text-warning-900 mb-2">Service Availability</h4>
                <p className="text-warning-800 text-sm">
                  The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                </p>
              </div>
              
              <div className="bg-error-50 p-4 rounded-lg border border-error-200">
                <h4 className="font-semibold text-error-900 mb-2">Limitation of Liability</h4>
                <p className="text-error-800 text-sm">
                  To the maximum extent permitted by law, PulseEarn shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use.
                </p>
              </div>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700">
              You agree to defend, indemnify, and hold harmless PulseEarn and its officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
            </p>
            <p className="text-gray-700">
              Upon termination, your right to use the Service will cease immediately. All provisions of these Terms that should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Gavel className="h-6 w-6 mr-3 text-primary-600" />
              Governing Law and Dispute Resolution
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.
              </p>
              
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="font-semibold text-primary-900 mb-2">Dispute Resolution</h4>
                <p className="text-primary-800 text-sm">
                  Any disputes arising from these Terms or your use of the Service will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
                </p>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> legal@pulselearn.com</p>
              <p><strong>Address:</strong> PulseEarn Legal Department, 123 Community Street, Digital City, DC 12345</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};