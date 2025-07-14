import React from 'react';
import { ArrowLeft, Shield, Users, FileText, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GdprCompliancePage: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">GDPR Compliance</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Our commitment to the General Data Protection Regulation (GDPR)
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our GDPR Commitment</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              PollPeak is committed to protecting your privacy and ensuring compliance with the General Data Protection 
              Regulation (GDPR). This page outlines your rights under GDPR and how we handle your personal data.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              The GDPR gives you control over your personal data and strengthens your privacy rights. We respect 
              these rights and have implemented measures to ensure compliance.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Rights Under GDPR</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Right of Access</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  You have the right to request access to your personal data. We will provide you with a copy of 
                  your personal data and information about how we process it.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Right of Rectification</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  You have the right to request that we correct any inaccurate or incomplete personal data we hold about you.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Lock className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Right to Erasure</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Also known as the "right to be forgotten," you can request that we delete your personal data in certain circumstances.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Right to Restrict Processing</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  You have the right to request that we restrict the processing of your personal data in certain circumstances.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Right to Data Portability</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  You have the right to receive your personal data in a structured, machine-readable format and to 
                  transmit it to another controller.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Mail className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Right to Object</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  You have the right to object to the processing of your personal data for direct marketing purposes 
                  or based on legitimate interests.
                </p>
              </div>
            </div>
          </section>

          {/* How We Process Data */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How We Process Your Data</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Legal Basis for Processing</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  We process your personal data based on the following legal grounds:
                </p>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Contract:</strong> To provide our services and fulfill our obligations to you</li>
                  <li>• <strong>Consent:</strong> Where you have given explicit consent for specific processing</li>
                  <li>• <strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
                  <li>• <strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Data Categories We Process</h3>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Account Information:</strong> Email, name, profile data</li>
                  <li>• <strong>Usage Data:</strong> Poll votes, trivia answers, activity logs</li>
                  <li>• <strong>Technical Data:</strong> IP address, browser information, device data</li>
                  <li>• <strong>Marketing Data:</strong> Communication preferences, survey responses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Retention</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, 
              including for the purposes of satisfying any legal, accounting, or reporting requirements.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Retention Periods</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                <li>• <strong>Account Data:</strong> Until account deletion or 3 years of inactivity</li>
                <li>• <strong>Poll/Trivia Data:</strong> Anonymized after 2 years</li>
                <li>• <strong>Analytics Data:</strong> 24 months maximum</li>
                <li>• <strong>Marketing Data:</strong> Until consent is withdrawn</li>
              </ul>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">International Data Transfers</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your personal data may be transferred to and processed in countries other than your own. We ensure that 
              such transfers are protected by appropriate safeguards.
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Safeguards</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Adequacy decisions by the European Commission</li>
                <li>• Standard Contractual Clauses (SCCs)</li>
                <li>• Binding Corporate Rules (BCRs)</li>
                <li>• Certification schemes and codes of conduct</li>
              </ul>
            </div>
          </section>

          {/* Making a Request */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Exercising Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To exercise any of your rights under GDPR, please contact us using the information below. We will respond 
              to your request within one month.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                <strong>Data Protection Officer:</strong> dpo@pollpeak.com
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                <strong>General Privacy Inquiries:</strong> privacy@pollpeak.com
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Contact Form:</strong> <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Submit a request</Link>
              </p>
            </div>

            <div className="mt-6 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Supervisory Authority</h3>
              <p className="text-gray-600 dark:text-gray-300">
                You have the right to lodge a complaint with your local supervisory authority if you believe we have 
                not handled your personal data in accordance with GDPR.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
