import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AmbassadorService } from '../services/ambassadorService';
import type { AmbassadorDetails, AmbassadorStats, CountryMetric } from '../types/api';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Share2, 
  Copy, 
  Award, 
  Target,
  Calendar,
  ChevronRight,
  ExternalLink,
  Gift,
  Trophy,
  Star
} from 'lucide-react';

export const AmbassadorPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [referralCode] = useState(profile?.referral_code || 'LOADING');
  const [copiedCode, setCopiedCode] = useState(false);
  const [ambassadorData, setAmbassadorData] = useState<{
    ambassador: AmbassadorDetails | null;
    stats: AmbassadorStats | null;
    recentMetrics: CountryMetric[];
    topCountries: { country: string; value: number }[];
  }>({
    ambassador: null,
    stats: null,
    recentMetrics: [],
    topCountries: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      fetchAmbassadorData();
    }
  }, [user]);

  const fetchAmbassadorData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    const { data, error: serviceError } = await AmbassadorService.getAmbassadorDashboard(user.id);
    
    if (serviceError) {
      setError(serviceError);
    } else if (data) {
      setAmbassadorData(data);
    }
    
    setLoading(false);
  };

  const copyReferralCode = () => {
    const referralLink = `${window.location.origin}/?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const displayStats = [
    {
      label: 'Total Referrals',
      value: ambassadorData.stats?.totalReferrals.toString() || '0',
      change: ambassadorData.stats?.referralsToNextTier 
        ? `${ambassadorData.stats.referralsToNextTier} to next tier` 
        : 'Top tier reached',
      icon: Users,
      color: 'from-primary-500 to-primary-600'
    },
    {
      label: 'Earnings',
      value: `$${ambassadorData.stats?.totalEarnings.toFixed(2) || '0.00'}`,
      change: `+$${ambassadorData.stats?.monthlyEarnings.toFixed(2) || '0.00'} this month`,
      icon: DollarSign,
      color: 'from-success-500 to-success-600'
    },
    {
      label: 'Commission Rate',
      value: `${ambassadorData.ambassador?.commission_rate || 0}%`,
      change: ambassadorData.stats?.nextTierName 
        ? `Next tier: ${ambassadorData.stats.nextTierName}` 
        : 'Top tier reached',
      icon: TrendingUp,
      color: 'from-accent-500 to-accent-600'
    },
    {
      label: 'Country Rank',
      value: `#${ambassadorData.stats?.countryRank || 1}`,
      change: `${ambassadorData.ambassador?.country || 'Global'}`,
      icon: Target,
      color: 'from-secondary-500 to-secondary-600'
    }
  ];

  const recentReferrals = [
    { name: 'Alex M.', joined: '2 days ago', status: 'Active', earned: '$8.50' },
    { name: 'Sarah K.', joined: '5 days ago', status: 'Active', earned: '$12.30' },
    { name: 'John D.', joined: '1 week ago', status: 'Active', earned: '$15.75' },
    { name: 'Emma R.', joined: '1 week ago', status: 'Inactive', earned: '$3.20' },
    { name: 'Mike T.', joined: '2 weeks ago', status: 'Active', earned: '$22.40' }
  ];

  // Get tier information from stats
  const currentTierName = ambassadorData.stats?.tierName || 'Bronze';
  const nextTierName = ambassadorData.stats?.nextTierName;
  const referralsToNextTier = ambassadorData.stats?.referralsToNextTier;
  
  // Define tiers based on data from the server
  const tierBenefits = [
    {
      tier: 'Bronze',
      requirement: '0-24 referrals',
      commission: '10%',
      bonuses: ['Welcome bonus', 'Monthly reports'],
      current: currentTierName === 'Bronze'
    },
    {
      tier: 'Silver',
      requirement: '25-99 referrals',
      commission: '15%',
      bonuses: ['Priority support', 'Custom landing page', 'Performance bonuses'],
      current: currentTierName === 'Silver'
    },
    {
      tier: 'Gold',
      requirement: '100-249 referrals',
      commission: '20%',
      bonuses: ['Dedicated manager', 'Exclusive events', 'Higher commission'],
      current: currentTierName === 'Gold'
    },
    {
      tier: 'Platinum',
      requirement: '250+ referrals',
      commission: '25%',
      bonuses: ['Maximum commission', 'VIP treatment', 'Special recognition'],
      current: currentTierName === 'Platinum'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ambassador dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchAmbassadorData}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 rounded-2xl">
              <Users className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ambassador <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Program</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {ambassadorData.ambassador ? 
              `Welcome back! You're representing ${ambassadorData.ambassador.country} with ${ambassadorData.stats?.totalReferrals || 0} referrals.` :
              'Earn real money by referring friends to PulseEarn. The more you share, the more you earn!'
            }
          </p>
          {ambassadorData.stats?.tierName && (
            <div className="mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                <Star className="h-4 w-4 mr-1" />
                {ambassadorData.stats.tierName} Tier
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
              <p className="text-sm text-success-600 font-medium">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Referral Tools */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Link */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referral Link</h2>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="text"
                  value={`${window.location.origin}/?ref=${referralCode}`}
                  readOnly
                  className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
                <button
                  onClick={copyReferralCode}
                  className="bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share on Facebook</span>
                </button>
                <button className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share on Twitter</span>
                </button>
                <button className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share on LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Referrals</h2>
              <div className="space-y-4">
                {recentReferrals.map((referral, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
                        {referral.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{referral.name}</p>
                        <p className="text-sm text-gray-500">Joined {referral.joined}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success-600">{referral.earned}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'Active'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {referral.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Performance</h2>
              {ambassadorData.recentMetrics.length > 0 ? (
                <div className="h-64 flex items-end justify-between space-x-2">
                  {ambassadorData.recentMetrics.slice(0, 7).reverse().map((metric, index) => {
                    const maxRevenue = Math.max(...ambassadorData.recentMetrics.map(m => m.ad_revenue));
                    const height = maxRevenue > 0 ? (metric.ad_revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-success-500 to-success-400 rounded-t-md mb-2 transition-all duration-500 hover:from-success-600 hover:to-success-500"
                          style={{ height: `${height}%` }}
                          title={`$${metric.ad_revenue.toFixed(2)} revenue`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {new Date(metric.metric_date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No performance data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Top Countries */}
            {ambassadorData.topCountries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Countries</h2>
                <div className="space-y-3">
                  {ambassadorData.topCountries.map((country, index) => (
                    <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{country.country}</span>
                      </div>
                      <span className="text-success-600 font-semibold">${country.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            {ambassadorData.ambassador && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ambassador Status</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Country:</span>
                    <span className="font-medium">{ambassadorData.ambassador.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="font-medium">{ambassadorData.ambassador.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${ambassadorData.ambassador.is_active ? 'text-success-600' : 'text-error-600'}`}>
                      {ambassadorData.ambassador.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {new Date(ambassadorData.ambassador.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Ambassador Tiers */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Ambassador Tiers</h2>
              <div className="space-y-4">
                {tierBenefits.map((tier, index) => {
                  const currentReferrals = ambassadorData.stats?.totalReferrals || 0;
                  const isCurrent = tier.current;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrent
                        ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{tier.tier}</h3>
                        {isCurrent && (
                          <span className="bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{tier.requirement}</p>
                      <p className="text-lg font-bold text-primary-600 mb-3">{tier.commission} commission</p>
                      <ul className="space-y-1">
                        {tier.bonuses.map((bonus, bonusIndex) => (
                          <li key={bonusIndex} className="text-sm text-gray-600 flex items-center">
                            <ChevronRight className="h-3 w-3 mr-1 text-primary-500" />
                            {bonus}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white p-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center space-x-2">
                  <ExternalLink className="h-5 w-5" />
                  <span>Marketing Materials</span>
                </button>
                <button className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white p-3 rounded-lg hover:from-secondary-700 hover:to-secondary-800 transition-all flex items-center justify-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Schedule Payout</span>
                </button>
                <button className="w-full bg-gradient-to-r from-accent-600 to-accent-700 text-white p-3 rounded-lg hover:from-accent-700 hover:to-accent-800 transition-all flex items-center justify-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>View Achievements</span>
                </button>
              </div>
            </div>

            {/* Payout Info */}
            {ambassadorData.stats && (
              <div className="bg-gradient-to-r from-success-600 to-success-700 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Next Payout</h3>
                <p className="text-success-100 mb-4">
                  Your next payout of ${ambassadorData.stats.totalEarnings.toFixed(2)} is scheduled for the 1st of next month.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-success-200">Minimum: $50</span>
                  <Trophy className="h-6 w-6 text-success-200" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};