import React, { useState } from 'react';
import { ArrowLeft, Search, MessageCircle, Book, Video, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: Book },
    { id: 'getting-started', name: 'Getting Started', icon: Download },
    { id: 'polls', name: 'Polls & Voting', icon: MessageCircle },
    { id: 'trivia', name: 'Trivia Games', icon: Video },
    { id: 'rewards', name: 'Rewards & Points', icon: ExternalLink },
    { id: 'account', name: 'Account & Profile', icon: Book },
  ];

  const helpArticles = [
    {
      id: 1,
      title: 'How to Create Your First Poll',
      category: 'polls',
      description: 'Learn how to create engaging polls and get maximum participation from the community.',
      content: `
        Creating a poll on PollPeak is simple and straightforward:
        
        1. **Navigate to Create Poll**: Click the "Create Poll" button in the header or dashboard
        2. **Enter Poll Details**: 
           - Add a compelling title
           - Write a clear description
           - Select appropriate category
        3. **Add Options**: Create 2-6 answer options for users to choose from
        4. **Set Duration**: Choose how long your poll should run (1-30 days)
        5. **Select Visibility**: Choose between public, country-specific, or private polls
        6. **Publish**: Review your poll and click "Create Poll"
        
        **Tips for Better Polls:**
        - Keep questions clear and concise
        - Use relevant images when possible
        - Choose appropriate categories for better discovery
        - Engage with voters through comments
      `
    },
    {
      id: 2,
      title: 'Understanding the Points System',
      category: 'rewards',
      description: 'Everything you need to know about earning and spending points on PollPeak.',
      content: `
        PollPeak uses a points-based reward system to encourage participation:
        
        **Earning Points:**
        - Voting on polls: 50 points per vote
        - Playing trivia: 100 points per correct answer
        - Daily login streak: 10-100 points (increases with streak)
        - Creating popular polls: Bonus points based on engagement
        - Referring friends: 200 points per successful referral
        
        **Spending Points:**
        - Spin the reward wheel: 100 points
        - Promote your polls: 500+ points
        - Claim special rewards: Varies by reward
        - Enter contests: Point-based entry fees
        
        **Point Multipliers:**
        - Weekend bonus: 1.5x points
        - Special events: Up to 3x points
        - Premium members: 1.2x multiplier
      `
    },
    {
      id: 3,
      title: 'How to Play Trivia Games',
      category: 'trivia',
      description: 'Master the trivia system and climb the leaderboards.',
      content: `
        Trivia games are a fun way to test your knowledge and earn points:
        
        **Game Types:**
        - Daily Trivia: New questions every day
        - Category Challenges: Focus on specific topics
        - Speed Rounds: Quick-fire questions
        - Multiplayer: Compete with other users
        
        **How to Play:**
        1. Navigate to the Trivia section
        2. Choose a game type or difficulty level
        3. Read each question carefully
        4. Select your answer within the time limit
        5. Earn points for correct answers
        6. Build streaks for bonus points
        
        **Scoring System:**
        - Correct answer: 100 points
        - Streak bonus: +25 points per consecutive correct answer
        - Speed bonus: Extra points for quick answers
        - Perfect game: 500 point bonus
        
        **Tips for Success:**
        - Read questions thoroughly
        - Use the process of elimination
        - Keep track of your strong categories
        - Play regularly to improve your knowledge
      `
    },
    {
      id: 4,
      title: 'Managing Your Account Settings',
      category: 'account',
      description: 'Customize your profile and manage your account preferences.',
      content: `
        Your account settings allow you to customize your PollPeak experience:
        
        **Profile Settings:**
        - Update your display name and bio
        - Upload a profile picture
        - Set your country/region
        - Choose your preferred categories
        
        **Privacy Settings:**
        - Control who can see your profile
        - Manage your activity visibility
        - Set communication preferences
        - Configure data sharing options
        
        **Notification Preferences:**
        - Email notifications for new polls
        - Push notifications for trivia games
        - Weekly digest emails
        - Achievement notifications
        
        **Security Settings:**
        - Change your password regularly
        - Enable two-factor authentication
        - Review login history
        - Manage connected social accounts
        
        **Account Management:**
        - Export your data
        - Delete specific content
        - Deactivate your account
        - Request account deletion
      `
    },
    {
      id: 5,
      title: 'Troubleshooting Common Issues',
      category: 'getting-started',
      description: 'Solutions to the most common problems users encounter.',
      content: `
        Here are solutions to common issues you might encounter:
        
        **Login Problems:**
        - Check your email and password
        - Try resetting your password
        - Clear your browser cache
        - Disable browser extensions temporarily
        
        **Voting Issues:**
        - Refresh the page and try again
        - Check if the poll is still active
        - Verify you haven't already voted
        - Try using a different browser
        
        **Points Not Updating:**
        - Wait a few minutes for sync
        - Check your internet connection
        - Log out and log back in
        - Contact support if issue persists
        
        **Mobile App Issues:**
        - Update to the latest version
        - Restart the app
        - Check your internet connection
        - Clear the app cache
        
        **Performance Issues:**
        - Close other browser tabs
        - Disable ad blockers temporarily
        - Try using incognito mode
        - Check our status page for outages
        
        **Still Need Help?**
        If these solutions don't work, please contact our support team with:
        - Description of the issue
        - Steps you've already tried
        - Your browser/device information
        - Screenshots if applicable
      `
    },
    {
      id: 6,
      title: 'Ambassador Program Guide',
      category: 'rewards',
      description: 'Learn how to become an ambassador and earn commissions.',
      content: `
        The Ambassador Program lets you earn by referring new users:
        
        **How It Works:**
        - Share your unique referral link
        - Earn commissions when people sign up and participate
        - Get bonus rewards for active referrals
        - Climb ambassador tiers for better rewards
        
        **Earning Structure:**
        - Sign-up bonus: $0.50 per new user
        - Activity bonus: $0.25 per active referral per month
        - Tier bonuses: 10-25% commission increase
        - Special promotions: Extra earning opportunities
        
        **Tier System:**
        - Bronze: 1-10 referrals
        - Silver: 11-50 referrals
        - Gold: 51-200 referrals
        - Platinum: 200+ referrals
        
        **Best Practices:**
        - Share genuine recommendations
        - Engage with your referrals
        - Use multiple channels (social media, email, etc.)
        - Stay active on the platform yourself
        
        **Payment:**
        - Monthly payments via PayPal or bank transfer
        - Minimum payout: $25
        - Detailed earnings dashboard
        - Tax forms provided for US ambassadors
      `
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Book className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Help Center</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Find answers to your questions and learn how to make the most of PollPeak
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium text-center">{category.name}</div>
              </button>
            );
          })}
        </div>

        {/* Help Articles */}
        <div className="space-y-4">
          {filteredArticles.map(article => (
            <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {article.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {categories.find(c => c.id === article.category)?.name || 'General'}
                    </span>
                  </div>
                </div>
              </div>
              
              {expandedArticle === article.id && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="pt-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {article.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No help articles found matching your search.
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Try adjusting your search terms or{' '}
              <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                contact our support team
              </Link>
              {' '}for personalized help.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/contact" 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Contact Support</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Get personal help from our team</div>
            </Link>
            
            <Link 
              to="/community-guidelines" 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <Book className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Community Guidelines</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Learn about our community rules</div>
            </Link>
            
            <Link 
              to="/report-issue" 
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <ExternalLink className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <div className="font-medium text-gray-900 dark:text-white">Report an Issue</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Report bugs or technical problems</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
