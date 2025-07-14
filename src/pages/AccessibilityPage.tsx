import React from 'react';
import { ArrowLeft, Users, Eye, Headphones, Navigation, Smartphone, Monitor, Keyboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AccessibilityPage: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Accessibility</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Our commitment to making PollPeak accessible to everyone
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
          {/* Commitment */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Our Accessibility Commitment</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              At PollPeak, we believe that everyone should have equal access to participate in our community-driven platform. 
              We're committed to ensuring that our website and services are accessible to users with disabilities and that 
              we continuously improve the user experience for all our community members.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              We strive to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards, 
              which provide a framework for making web content more accessible to people with disabilities.
            </p>
          </section>

          {/* Standards */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Accessibility Standards</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">WCAG 2.1 Compliance</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our accessibility efforts are guided by the four main principles of WCAG 2.1:
              </p>
              <div className="grid gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Perceivable</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Information and UI components must be presentable to users in ways they can perceive.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Operable</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    UI components and navigation must be operable by all users.
                  </p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Understandable</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Information and the operation of the UI must be understandable.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Robust</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Content must be robust enough to be interpreted by a wide variety of user agents.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Accessibility Features</h2>
            
            <div className="grid gap-6">
              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Keyboard className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Keyboard Navigation</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Full keyboard navigation support for users who cannot use a mouse:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Tab navigation through all interactive elements</li>
                  <li>• Visible focus indicators</li>
                  <li>• Logical tab order</li>
                  <li>• Keyboard shortcuts for common actions</li>
                  <li>• Skip links to main content</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Headphones className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Screen Reader Support</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Comprehensive screen reader compatibility:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Semantic HTML markup</li>
                  <li>• ARIA labels and descriptions</li>
                  <li>• Alternative text for images</li>
                  <li>• Descriptive link text</li>
                  <li>• Proper heading structure</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Eye className="h-5 w-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Visual Accessibility</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Features to support users with visual impairments:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• High contrast color schemes</li>
                  <li>• Scalable text (up to 200% zoom)</li>
                  <li>• Dark mode support</li>
                  <li>• Clear visual hierarchy</li>
                  <li>• Sufficient color contrast ratios</li>
                </ul>
              </div>

              <div className="border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <Monitor className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Responsive Design</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Accessible across all devices and screen sizes:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Mobile-first responsive design</li>
                  <li>• Touch-friendly interface elements</li>
                  <li>• Consistent experience across devices</li>
                  <li>• Orientation support</li>
                  <li>• Flexible layouts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Assistive Technologies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Supported Assistive Technologies</h2>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                PollPeak has been tested with and supports the following assistive technologies:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Screen Readers</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• JAWS (Windows)</li>
                    <li>• NVDA (Windows)</li>
                    <li>• VoiceOver (macOS/iOS)</li>
                    <li>• TalkBack (Android)</li>
                    <li>• Dragon NaturallySpeaking</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Browsers</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Chrome (latest versions)</li>
                    <li>• Firefox (latest versions)</li>
                    <li>• Safari (latest versions)</li>
                    <li>• Edge (latest versions)</li>
                    <li>• Mobile browsers</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* User Controls */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">User Controls</h2>
            
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Accessibility Settings</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  We provide user controls to customize the accessibility experience:
                </p>
                <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• <strong>Theme Selection:</strong> Switch between light and dark modes</li>
                  <li>• <strong>Font Size:</strong> Adjust text size for better readability</li>
                  <li>• <strong>Animation Control:</strong> Reduce motion for users sensitive to movement</li>
                  <li>• <strong>Notification Settings:</strong> Customize how you receive updates</li>
                  <li>• <strong>Color Preferences:</strong> High contrast options</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Keyboard Shortcuts</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  Common keyboard shortcuts for efficient navigation:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">Tab</kbd> - Next element</li>
                      <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">Shift+Tab</kbd> - Previous element</li>
                      <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">Enter</kbd> - Activate button/link</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">Space</kbd> - Select checkbox</li>
                      <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">Esc</kbd> - Close modal/menu</li>
                      <li>• <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">Arrow keys</kbd> - Navigate options</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ongoing Efforts */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Ongoing Accessibility Efforts</h2>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Continuous Improvement</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Accessibility is an ongoing process. We're committed to:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>Regular Testing:</strong> Ongoing accessibility audits and testing</li>
                <li>• <strong>User Feedback:</strong> Incorporating feedback from users with disabilities</li>
                <li>• <strong>Team Training:</strong> Educating our development team on accessibility best practices</li>
                <li>• <strong>Technology Updates:</strong> Keeping up with the latest accessibility standards and tools</li>
                <li>• <strong>Community Engagement:</strong> Working with accessibility organizations and experts</li>
              </ul>
            </div>
          </section>

          {/* Feedback */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Accessibility Feedback</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Help Us Improve</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We value your feedback on the accessibility of PollPeak. If you encounter any accessibility barriers 
                or have suggestions for improvement, please don't hesitate to reach out:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Contact Methods</h4>
                  <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                    <li>• <strong>Email:</strong> <a href="mailto:accessibility@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">accessibility@pollpeak.com</a></li>
                    <li>• <strong>Contact Form:</strong> <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Submit feedback through our contact form</Link></li>
                    <li>• <strong>Support:</strong> <a href="mailto:support@pollpeak.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@pollpeak.com</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">When Reporting Issues</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Please include the following information to help us address your concern quickly:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mt-2">
                    <li>• Description of the accessibility barrier</li>
                    <li>• Page or feature where the issue occurred</li>
                    <li>• Assistive technology used (if applicable)</li>
                    <li>• Browser and operating system</li>
                    <li>• Steps to reproduce the issue</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-semibaced text-gray-900 dark:text-white mb-4">Third-Party Services</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              While we strive to ensure our platform is fully accessible, we also use some third-party services 
              that may have their own accessibility features and limitations. We work with vendors who share our 
              commitment to accessibility and regularly review their compliance.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              If you experience accessibility issues with any third-party features, please let us know so we can 
              work with our vendors to address them.
            </p>
          </section>

          {/* Legal */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Legal Framework</h2>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our accessibility efforts are guided by various legal frameworks and standards:
              </p>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>Americans with Disabilities Act (ADA)</strong> - U.S. federal law</li>
                <li>• <strong>Section 508</strong> - U.S. federal accessibility standards</li>
                <li>• <strong>European Accessibility Act</strong> - EU accessibility requirements</li>
                <li>• <strong>WCAG 2.1</strong> - International accessibility guidelines</li>
                <li>• <strong>Local Accessibility Laws</strong> - Various jurisdictions worldwide</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
