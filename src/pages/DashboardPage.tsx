import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Trophy, 
  Zap, 
  Calendar, 
  Users, 
  BarChart3, 
  Brain, 
  Gift,
  Star,
  Clock,
  Target,
  Award,
  DollarSign,
  Tv
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../hooks/useRewards';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useBadges } from '../hooks/useBadges';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import { SponsorDashboard } from '../components/sponsor';

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { status, getHistory } = useRewards(user?.id);
  const { getUserRank, loading: leaderboardLoading } = useLeaderboard();
  const { userProgress, getEarnedBadgesCount, getBadgesInProgressCount, getNextBadgeToEarn } = useBadges(user?.id);
  const { errorToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'sponsor'>('overview');
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    globalRank: 0,
    level: 'Beginner',
    levelProgress: 0,
    levelMax: 1000
  });

  const [recentActivities, setRecentActivities] = useState<Array<{
    type: string;
    title: string;
    points: number;
    time: string;
    icon: React.ElementType;
  }>>([]);

  const [achievements, setAchievements] = useState<Array<{
    name: string;
    description: string;
    completed: boolean;
    progress?: number;
  }>>([]);

  const [pointsProgress, setPointsProgress] = useState<Array<number>>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  // Calculate user level based on points
  const calculateLevel = (points: number) => {
    if (points >= 100000) return { level: 'Legend', progress: points, max: 100000 };
    if (points >= 50000) return { level: 'Master', progress: points - 50000, max: 50000 };
    if (points >= 25000) return { level: 'Expert', progress: points - 25000, max: 25000 };
    if (points >= 10000) return { level: 'Advanced', progress: points - 10000, max: 15000 };
    if (points >= 5000) return { level: 'Intermediate', progress: points - 5000, max: 5000 };
    if (points >= 1000) return { level: 'Novice', progress: points - 1000, max: 4000 };
    return { level: 'Beginner', progress: points, max: 1000 };
  };

  // Map reward type to icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'poll':
        return BarChart3;
      case 'trivia':
        return Brain;
      case 'spin':
        return Gift;
      case 'watch':
        return Tv;
      case 'achievement':
        return Award;
      default:
        return Star;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !profile || leaderboardLoading || dataFetchAttempted) {
        return;
      }

      setLoading(true);
      setDataFetchAttempted(true);
      
      try {
        // Fetch user rank
        const rankResult = await getUserRank(user.id);
        const globalRank = rankResult.success ? rankResult.globalRank || 0 : 0;

        // Calculate level
        const levelInfo = calculateLevel(profile.points);

        // Update stats
        setStats({
          totalPoints: profile.points,
          currentStreak: status?.triviaStreak || 0,
          globalRank,
          level: levelInfo.level,
          levelProgress: levelInfo.progress,
          levelMax: levelInfo.max
        });

        // Fetch recent activity history
        const historyResult = await getHistory({ limit: 10 });
        if (historyResult.success && historyResult.history) {
          const activities = historyResult.history.map(item => {
            let type = item.reward_type;
            let title = '';
            let points = item.points_earned;

            // Determine activity title based on reward type and data
            switch (item.reward_type) {
              case 'spin':
                if (item.reward_data?.redemption_type === 'store_item') {
                  type = 'store';
                  title = `Redeemed "${item.reward_data.item_name}"`;
                  points = -Math.abs(points); // Ensure negative for redemptions
                } else {
                  title = item.points_earned > 0 
                    ? `Won ${item.points_earned} points from Spin & Win` 
                    : 'Tried Spin & Win but didn\'t win';
                }
                break;
              case 'trivia':
                const isCorrect = item.reward_data?.is_correct;
                const difficulty = item.reward_data?.difficulty || 'unknown';
                title = isCorrect 
                  ? `Answered ${difficulty} trivia correctly` 
                  : 'Answered trivia incorrectly';
                break;
              case 'watch':
                title = 'Watched ad for points';
                break;
              case 'referral_signup':
                title = 'Signed up with referral code';
                break;
              case 'referral_bonus':
                title = 'Earned referral bonus';
                break;
              default:
                title = `Earned ${item.points_earned} points`;
            }

            return {
              type,
              title,
              points: item.points_earned,
              time: new Date(item.created_at).toRelativeTime(),
              icon: getActivityIcon(type)
            };
          });

          setRecentActivities(activities);

          // Calculate points progress for the last 7 days
          const last7Days = Array(7).fill(0);
          const today = new Date();
          
          historyResult.history.forEach(item => {
            const itemDate = new Date(item.created_at);
            const dayDiff = Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDiff >= 0 && dayDiff < 7) {
              // Only count positive point earnings for the chart
              if (item.points_earned > 0) {
                last7Days[6 - dayDiff] += item.points_earned;
              }
            }
          });
          
          setPointsProgress(last7Days);
        }

        // Process achievements from userProgress
        if (userProgress) {
          const mappedAchievements = userProgress.map(badge => ({
            name: badge.badge.name,
            description: badge.badge.description,
            completed: badge.earned,
            progress: badge.earned ? 100 : Math.round((badge.progress / badge.maxProgress) * 100)
          }));
          
          setAchievements(mappedAchievements);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        errorToast('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, profile, status, getUserRank, getHistory, userProgress, errorToast, leaderboardLoading, dataFetchAttempted]);

  // Add relative time method to Date prototype if it doesn't exist
  if (!Date.prototype.toRelativeTime) {
    Date.prototype.toRelativeTime = function() {
      const now = new Date();
      const diffMs = now.getTime() - this.getTime();
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);
      
      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
      if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      
      return this.toLocaleDateString();
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your progress and manage your PulseEarn journey</p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('sponsor')}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === 'sponsor'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Sponsor</span>
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Available Points</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-accent-500 to-accent-600 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Current Streak</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.currentStreak} days</p>
                  </div>
                  <div className="bg-gradient-to-r from-success-500 to-success-600 p-3 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Global Rank</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.globalRank > 0 ? `#${stats.globalRank}` : 'Unranked'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-warning-500 to-warning-600 p-3 rounded-lg">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Level</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.level}</p>
                  </div>
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-3 rounded-lg">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                      <p className="text-gray-600 mb-6">
                        Start participating in polls, trivia, and daily rewards to see your activity here!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="bg-primary-100 p-2 rounded-lg">
                            <activity.icon className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium">{activity.title}</p>
                            <p className="text-gray-500 text-sm">{activity.time}</p>
                          </div>
                          <div className="text-right">
                            <span className={`font-semibold ${activity.points >= 0 ? 'text-accent-600' : 'text-error-600'}`}>
                              {activity.points >= 0 ? '+' : ''}{activity.points}
                            </span>
                            <p className="text-gray-500 text-xs">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progress Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Points Progress</h2>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {pointsProgress.map((height, index) => {
                      const maxHeight = Math.max(...pointsProgress, 100); // Ensure at least 100 for scale
                      const percentage = height > 0 ? (height / maxHeight) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                            style={{ height: `${percentage}%` }}
                            title={`${height} points`}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Achievements</h2>
                  {achievements.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Loading achievements...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {achievements.slice(0, 5).map((achievement, index) => (
                        <div key={index} className="p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{achievement.name}</h3>
                            {achievement.completed ? (
                              <Award className="h-5 w-5 text-success-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          {!achievement.completed && achievement.progress !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${achievement.progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Link
                      to="/rewards?tab=achievements"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View All Achievements
                    </Link>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    <Link
                      to="/polls"
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white p-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center space-x-2"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span>Vote in Polls</span>
                    </Link>
                    <Link
                      to="/trivia"
                      className="w-full bg-gradient-to-r from-secondary-600 to-secondary-700 text-white p-3 rounded-lg hover:from-secondary-700 hover:to-secondary-800 transition-all flex items-center justify-center space-x-2"
                    >
                      <Brain className="h-5 w-5" />
                      <span>Play Trivia</span>
                    </Link>
                    <Link
                      to="/rewards"
                      className="w-full bg-gradient-to-r from-accent-600 to-accent-700 text-white p-3 rounded-lg hover:from-accent-700 hover:to-accent-800 transition-all flex items-center justify-center space-x-2"
                    >
                      <Gift className="h-5 w-5" />
                      <span>Claim Rewards</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sponsor Dashboard */}
        {activeTab === 'sponsor' && <SponsorDashboard />}
      </div>
    </div>
  );
};

// Add toRelativeTime method to Date prototype
declare global {
  interface Date {
    toRelativeTime(): string;
  }
}