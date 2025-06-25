import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  Globe, 
  MapPin, 
  TrendingUp,
  Star,
  Crown,
  Target,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLeaderboard } from '../hooks/useLeaderboard';

export const LeaderboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { 
    globalLeaderboard, 
    countryLeaderboard, 
    loading, 
    error, 
    fetchGlobalLeaderboard, 
    fetchCountryLeaderboard,
    getUserRank,
    getLeaderboardStats
  } = useLeaderboard();
  
  const [activeTab, setActiveTab] = useState<'global' | 'country'>('global');
  const [userRank, setUserRank] = useState<{ globalRank?: number; countryRank?: number } | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      getUserRank(user.id).then(result => {
        if (result.success) {
          setUserRank({
            globalRank: result.globalRank,
            countryRank: result.countryRank
          });
        }
      });
    }
  }, [user]);

  useEffect(() => {
    getLeaderboardStats().then(result => {
      if (result.success) {
        setStats(result.stats);
      }
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'country' && profile?.country) {
      fetchCountryLeaderboard(profile.country);
    }
  }, [activeTab, profile?.country]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-warning-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-warning-500 to-warning-600';
      case 2:
        return 'from-gray-400 to-gray-500';
      case 3:
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-primary-500 to-primary-600';
    }
  };

  const currentLeaderboard = activeTab === 'global' ? globalLeaderboard : countryLeaderboard;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-warning-500 to-warning-600 p-4 rounded-2xl">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leaderboard <span className="bg-gradient-to-r from-warning-600 to-warning-700 bg-clip-text text-transparent">Champions</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how you rank against other community members and compete for the top spots!
          </p>
        </div>

        {/* User Rank Card */}
        {user && userRank && (
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{profile?.name || 'You'}</h3>
                  <p className="text-primary-100">
                    {(profile?.points || 0).toLocaleString()} points
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  #{userRank.globalRank || '?'}
                </div>
                <div className="text-primary-200 text-sm">Global Rank</div>
                {profile?.country && userRank.countryRank && (
                  <>
                    <div className="text-lg font-semibold mt-1">
                      #{userRank.countryRank}
                    </div>
                    <div className="text-primary-200 text-xs">{profile.country} Rank</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-success-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Points</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averagePoints.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-warning-100 p-3 rounded-lg">
                  <Globe className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Country</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.topCountries[0]?.country || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('global')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'global'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Global</span>
            </button>
            <button
              onClick={() => setActiveTab('country')}
              disabled={!profile?.country}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'country'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${!profile?.country ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MapPin className="h-4 w-4" />
              <span>{profile?.country || 'Country'}</span>
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Leaderboard */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                {activeTab === 'global' ? (
                  <>
                    <Globe className="h-5 w-5" />
                    <span>Global Leaderboard</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5" />
                    <span>{profile?.country} Leaderboard</span>
                  </>
                )}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {currentLeaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    entry.id === user?.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      entry.rank <= 3 
                        ? `bg-gradient-to-r ${getRankBadgeColor(entry.rank)} text-white`
                        : 'bg-gray-100'
                    }`}>
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
                        {(entry.name || entry.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.name || 'Anonymous User'}
                          {entry.id === user?.id && (
                            <span className="ml-2 text-primary-600 text-sm">(You)</span>
                          )}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {entry.country && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{entry.country}</span>
                            </span>
                          )}
                          <span className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{entry.badges.length} badges</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      {entry.points.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>

            {currentLeaderboard.length === 0 && !loading && (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
                <p className="text-gray-600">
                  {activeTab === 'country' 
                    ? 'No users from your country have earned points yet.'
                    : 'Be the first to earn points and claim the top spot!'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Top Countries */}
        {stats && stats.topCountries.length > 0 && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Countries by Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topCountries.slice(0, 6).map((country: any, index: number) => (
                <div key={country.country} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{country.country}</span>
                  </div>
                  <span className="text-gray-600">{country.userCount} users</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};