import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, BarChart3, Brain, Gift, Users, Trophy, 
  DollarSign, Star, TrendingUp, Shield, ChevronRight
} from 'lucide-react';
import { ContentAd } from '../components/ads/ContentAd';
import { SidebarAd } from '../components/ads/SidebarAd';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Interactive Polls',
      description: 'Create and participate in engaging polls on topics you care about. Every vote earns you points!',
      color: 'from-primary-500 to-primary-600'
    },
    {
      icon: Brain,
      title: 'Trivia Challenges',
      description: 'Test your knowledge with our diverse trivia categories. Win big and climb the leaderboards!',
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      icon: Gift,
      title: 'Daily Rewards',
      description: 'Log in every day to claim your rewards. Streak bonuses multiply your earning potential!',
      color: 'from-accent-500 to-accent-600'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Join a vibrant community of engaged users. Share, discuss, and grow together!',
      color: 'from-success-500 to-success-600'
    }
  ];

  const stats = [
    { label: 'Active Users', value: '50K+', icon: Users },
    { label: 'Polls Created', value: '10K+', icon: BarChart3 },
    { label: 'Points Earned', value: '1M+', icon: Trophy },
    { label: 'Rewards Claimed', value: '25K+', icon: Gift }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-50 opacity-70"></div>
          <div className="absolute top-1/3 -left-24 w-64 h-64 rounded-full bg-secondary-50 opacity-60"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent-50 opacity-50"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col items-center justify-center">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-600 mb-6 animate-fade-in">
                <span className="text-sm font-medium">Community-Powered Insights</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-6 animate-slide-up">
                <span>Your Voice,</span>
                <span className="block bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
                  Your Rewards
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-slide-up" style={{animationDelay: "0.1s"}}>
                Join PollPeak and transform your opinions into rewards. Create polls, vote on trending topics, and earn points through our interactive community platform.
              </p>
              <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{animationDelay: "0.2s"}}>
                <Link
                  to="/polls"
                  className="bg-primary-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-600 transform hover:translate-y-[-2px] transition-all duration-200 flex items-center justify-center space-x-2 shadow-md"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/trivia"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transform hover:translate-y-[-2px] transition-all duration-200 border border-primary-200 flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Brain className="h-5 w-5" />
                  <span>Try Trivia</span>
                </Link>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Content Ad after Hero */}
      <ContentAd layout="in-feed" />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-r from-primary-100 to-secondary-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <div className="flex-1">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <span className="block bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
                Earn & Engage
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines entertainment with earning opportunities, 
              creating the perfect environment for community engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-r ${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
            </div>
            
            {/* Sidebar Ad */}
            <div className="hidden lg:block w-80">
              <SidebarAd />
            </div>
          </div>
        </div>
      </section>

      {/* Content Ad between sections */}
      <ContentAd layout="in-article" />

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How PollPeak Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start earning through community engagement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Join & Participate</h3>
              <p className="text-gray-600">
                Sign up and start participating in polls, trivia, and daily challenges
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Earn Points</h3>
              <p className="text-gray-600">
                Every activity earns you points. Maintain streaks for bonus multipliers
              </p>
            </div>
            <div className="text-center group">
              <div className="bg-gradient-to-r from-accent-500 to-accent-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Claim Rewards</h3>
              <p className="text-gray-600">
                Redeem points for rewards or earn commissions through our ambassador program
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who are already earning through community engagement. 
              Your opinions matter, and now they can pay off too!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <TrendingUp className="h-5 w-5" />
                <span>View Dashboard</span>
              </Link>
              <Link
                to="/ambassador"
                className="bg-transparent text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transform hover:scale-105 transition-all duration-200 border-2 border-white/20 flex items-center justify-center space-x-2"
              >
                <DollarSign className="h-5 w-5" />
                <span>Ambassador Program</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};