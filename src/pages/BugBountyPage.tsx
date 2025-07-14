import React from 'react';
import { ArrowLeft, Shield, Award, Users, DollarSign, Target, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BugBountyPage: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Bug Bounty Program</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Help us keep PollPeak secure and earn rewards for discovering vulnerabilities
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to Our Bug Bounty Program</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              At PollPeak, we believe in the power of the security community to help us maintain a safe and secure platform. 
              Our Bug Bounty Program rewards security researchers who discover and responsibly disclose vulnerabilities in our systems.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              We're committed to working with the security community to ensure the privacy and security of our users' data.
            </p>
          </section>

          {/* Program Status */}
          <section>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Program Status</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Coming Soon:</strong> Our Bug Bounty Program is currently in development. We're working on establishing 
                partnerships with security researchers and finalizing our vulnerability disclosure process. 
                Check back soon for updates!
              </p>
            </div>
          </section>

          {/* Planned Scope */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Planned Program Scope</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Target className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">In Scope</h3>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Web Application:</strong> pollpeak.com and all subdomains</li>
                  <li>• <strong>Mobile Apps:</strong> iOS and Android applications (when released)</li>
                  <li>• <strong>APIs:</strong> Public-facing API endpoints</li>
                  <li>• <strong>Authentication:</strong> Login, registration, and session management</li>
                  <li>• <strong>Data Protection:</strong> User data handling and privacy</li>
                  <li>• <strong>Payment Systems:</strong> Payment processing and financial data</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Out of Scope</h3>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Third-party Services:</strong> Issues in external services we use</li>
                  <li>• <strong>Social Engineering:</strong> Attacks targeting our employees</li>
                  <li>• <strong>Physical Security:</strong> Physical access to our facilities</li>
                  <li>• <strong>DoS/DDoS:</strong> Denial of service attacks</li>
                  <li>• <strong>Spam/Bruteforce:</strong> Automated attacks and spam</li>
                  <li>• <strong>Public Information:</strong> Publicly available information</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Vulnerability Categories */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Vulnerability Categories & Rewards</h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Critical Vulnerabilities</h3>
                  </div>
                  <span className="text-lg font-bold text-red-600">$500 - $2,000</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Vulnerabilities that could lead to complete system compromise or significant data breach:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Remote Code Execution (RCE)</li>
                  <li>• SQL Injection leading to data exposure</li>
                  <li>• Authentication bypass</li>
                  <li>• Privilege escalation to admin</li>
                  <li>• Mass data exposure</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">High Vulnerabilities</h3>
                  </div>
                  <span className="text-lg font-bold text-orange-600">$200 - $500</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Vulnerabilities with significant impact on user security:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Cross-Site Scripting (XSS) with significant impact</li>
                  <li>• Cross-Site Request Forgery (CSRF)</li>
                  <li>• Server-Side Request Forgery (SSRF)</li>
                  <li>• Insecure Direct Object References (IDOR)</li>
                  <li>• Local File Inclusion (LFI)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medium Vulnerabilities</h3>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">$50 - $200</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Vulnerabilities with moderate impact:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Information disclosure</li>
                  <li>• Business logic flaws</li>
                  <li>• Insecure file upload</li>
                  <li>• Session management issues</li>
                  <li>• Rate limiting bypass</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Low Vulnerabilities</h3>
                  </div>
                  <span className="text-lg font-bold text-green-600">$25 - $50</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Vulnerabilities with minimal impact:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Minor information disclosure</li>
                  <li>• UI/UX security issues</li>
                  <li>• Security misconfigurations</li>
                  <li>• Weak password policies</li>
                  <li>• Missing security headers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Submission Guidelines */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Submission Guidelines</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">How to Submit a Vulnerability</h3>
              <ol className="text-gray-600 dark:text-gray-300 space-y-3">
                <li>
                  <strong>1. Research Responsibly:</strong> Only test on accounts you own or have explicit permission to test
                </li>
                <li>
                  <strong>2. Document Thoroughly:</strong> Include detailed steps to reproduce, impact assessment, and proof of concept
                </li>
                <li>
                  <strong>3. Submit via Email:</strong> Send your report to <a href="mailto:security@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">security@pollpeak.com</a>
                </li>
                <li>
                  <strong>4. Allow Time:</strong> Give us reasonable time to investigate and fix the issue before public disclosure
                </li>
                <li>
                  <strong>5. Follow Up:</strong> We'll acknowledge receipt within 48 hours and provide regular updates
                </li>
              </ol>
            </div>
          </section>

          {/* Rules and Requirements */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Rules and Requirements</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Eligibility</h3>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Must be 18 years or older (or have parental consent)</li>
                  <li>• Cannot be a current or former employee of PollPeak</li>
                  <li>• Must not be located in sanctioned countries</li>
                  <li>• Must follow responsible disclosure practices</li>
                  <li>• Must not violate any applicable laws</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Prohibited Activities</h3>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Accessing or modifying other users' data without permission</li>
                  <li>• Performing actions that could harm service availability</li>
                  <li>• Social engineering attacks on our employees</li>
                  <li>• Physical attempts to access our facilities</li>
                  <li>• Public disclosure before we've had time to fix the issue</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Recognition */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Recognition</h2>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Award className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hall of Fame</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We'll maintain a Hall of Fame to recognize security researchers who have helped improve our platform's security. 
                With your permission, we'll include:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Your name or handle</li>
                <li>• Link to your website or social media</li>
                <li>• Brief description of the vulnerability discovered</li>
                <li>• Date of discovery and resolution</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Security Team</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Email:</strong> <a href="mailto:security@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">security@pollpeak.com</a>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                    PGP Key: <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Download Public Key</a>
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">General Questions</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    For questions about our Bug Bounty Program, contact us through our{' '}
                    <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact form</Link>
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Updates</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Follow us on social media or check this page regularly for updates on our Bug Bounty Program launch.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Coming Soon Notice */}
          <section>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
              <Users className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Program Launch Coming Soon
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We're finalizing the details of our Bug Bounty Program and expect to launch it within the next few months. 
                In the meantime, you can still report security issues to our security team.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Thank you for your interest in helping us keep PollPeak secure!
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
