import React from 'react';
import { ArrowLeft, Users, MessageCircle, Shield, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CommunityGuidelinesPage: React.FC = () => {
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
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Community Guidelines</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Our community standards for creating a safe and welcoming environment for everyone
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Community Promise</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              PollPeak is built on the foundation of respectful dialogue and inclusive participation. Our community 
              guidelines help ensure that everyone can engage safely and constructively in polls, discussions, and 
              social interactions.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              By using PollPeak, you agree to follow these guidelines. Violations may result in content removal, 
              account restrictions, or permanent bans, depending on the severity and frequency of violations.
            </p>
          </section>

          {/* Core Values */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Core Values</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Respect and Kindness</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Treat all community members with respect, regardless of their background, beliefs, or opinions. 
                  Engage in constructive dialogue and be open to different perspectives.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Safety and Security</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  We prioritize the safety and well-being of our community. Report any content or behavior 
                  that makes you feel unsafe or uncomfortable.
                </p>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <MessageCircle className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Authentic Participation</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Participate genuinely and authentically. Avoid spam, manipulation, or artificial engagement. 
                  Your real opinions and thoughts make our community valuable.
                </p>
              </div>
            </div>
          </section>

          {/* Acceptable Content */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">What We Welcome</h2>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Encouraged Content</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>Thoughtful polls</strong> that spark meaningful discussions</li>
                <li>• <strong>Diverse perspectives</strong> that add value to conversations</li>
                <li>• <strong>Constructive feedback</strong> that helps improve the community</li>
                <li>• <strong>Educational content</strong> that informs and enlightens</li>
                <li>• <strong>Creative polls</strong> that are fun and engaging</li>
                <li>• <strong>Respectful debate</strong> that explores different viewpoints</li>
                <li>• <strong>Helpful responses</strong> that assist other users</li>
                <li>• <strong>Positive interactions</strong> that build community spirit</li>
              </ul>
            </div>
          </section>

          {/* Prohibited Content */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">What We Don't Allow</h2>
            
            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Ban className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Hate Speech & Harassment</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Content that attacks, threatens, or discriminates against individuals or groups based on:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Race, ethnicity, or national origin</li>
                  <li>• Religion or religious beliefs</li>
                  <li>• Gender, gender identity, or sexual orientation</li>
                  <li>• Disability, age, or medical conditions</li>
                  <li>• Political beliefs or affiliations</li>
                </ul>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Harmful Content</h3>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Violence & Threats:</strong> Content promoting violence or threatening harm</li>
                  <li>• <strong>Self-Harm:</strong> Content encouraging self-injury or suicide</li>
                  <li>• <strong>Adult Content:</strong> Sexually explicit material or inappropriate content</li>
                  <li>• <strong>Illegal Activities:</strong> Content promoting illegal actions or substances</li>
                  <li>• <strong>Misinformation:</strong> Deliberately false or misleading information</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Spam & Manipulation</h3>
                </div>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Spam:</strong> Repetitive, irrelevant, or promotional content</li>
                  <li>• <strong>Vote Manipulation:</strong> Artificially inflating poll results</li>
                  <li>• <strong>Fake Accounts:</strong> Creating multiple accounts to manipulate results</li>
                  <li>• <strong>Phishing:</strong> Attempts to steal personal information</li>
                  <li>• <strong>Malware:</strong> Links to malicious software or websites</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Poll-Specific Guidelines */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Poll Creation Guidelines</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Best Practices for Polls</h3>
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Clear and Fair Questions</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Write clear, unbiased questions</li>
                    <li>• Provide balanced answer options</li>
                    <li>• Avoid leading or loaded questions</li>
                    <li>• Include sufficient context</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Appropriate Topics</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Choose topics relevant to the community</li>
                    <li>• Avoid overly personal or sensitive questions</li>
                    <li>• Respect privacy and confidentiality</li>
                    <li>• Consider the global audience</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Enforcement */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Enforcement and Consequences</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Progressive Enforcement</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We believe in giving users opportunities to learn and improve. Our enforcement follows a 
                  progressive approach:
                </p>
                <ol className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong>1. Warning:</strong> First-time minor violations receive a warning</li>
                  <li><strong>2. Content Removal:</strong> Violating content is removed from the platform</li>
                  <li><strong>3. Temporary Restrictions:</strong> Limited access to certain features</li>
                  <li><strong>4. Account Suspension:</strong> Temporary ban from the platform</li>
                  <li><strong>5. Permanent Ban:</strong> Severe or repeated violations</li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Appeals Process</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  If you believe your content was incorrectly removed or your account was unfairly restricted:
                </p>
                <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Submit an appeal through our <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact form</Link></li>
                  <li>• Provide specific details about the disputed action</li>
                  <li>• Our team will review your case within 48 hours</li>
                  <li>• You'll receive a detailed response about the decision</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Reporting Violations</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Help us maintain a safe community by reporting content that violates these guidelines:
            </p>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">How to Report</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>In-app Reporting:</strong> Use the "Report" button on any poll or comment</li>
                <li>• <strong>Email:</strong> Send details to <a href="mailto:reports@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">reports@pollpeak.com</a></li>
                <li>• <strong>Contact Form:</strong> Submit a detailed report through our <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link></li>
                <li>• <strong>Emergency Issues:</strong> For urgent safety concerns, contact us immediately</li>
              </ul>
            </div>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Updates to Guidelines</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              These guidelines may be updated from time to time to reflect changes in our community, 
              technology, or legal requirements. We'll notify users of significant changes.
            </p>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Stay Informed</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Check this page regularly for updates, or follow our official announcements. 
                Questions about these guidelines? <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact us</Link> anytime.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
