import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  DollarSign,
  Calendar,
  Globe,
  Award,
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  Filter,
  RefreshCw,
  Brain,
  Search
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import { format, subDays, parseISO } from 'date-fns';
import { downloadCSV, formatDataForExport } from '../../utils/exportData';

export const AnalyticsDashboard: React.FC = () => {
  const { errorToast, successToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topCountries, setTopCountries] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [pollAnalytics, setPollAnalytics] = useState<any>(null);
  const [triviaAnalytics, setTriviaAnalytics] = useState<any>(null);
  
  // Date filter state
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [dateRangePreset, setDateRangePreset] = useState<string>('30days');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'polls' | 'trivia'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const applyDateFilter = () => {
    setIsFiltering(true);
    fetchDashboardData();
  };

  const handleDateRangeChange = (preset: string) => {
    const today = new Date();
    let start = new Date();
    
    switch (preset) {
      case '7days':
        start = subDays(today, 7);
        break;
      case '30days':
        start = subDays(today, 30);
        break;
      case '90days':
        start = subDays(today, 90);
        break;
      case 'year':
        start = subDays(today, 365);
        break;
      case 'custom':
        // Don't change dates, just update the preset
        setDateRangePreset('custom');
        return;
      default:
        start = subDays(today, 30);
    }
    
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(today, 'yyyy-MM-dd'));
    setDateRangePreset(preset);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dateOptions = {
        startDate,
        endDate
      };
      
      // Fetch all data in parallel
      const [
        platformStatsResult,
        recentActivityResult,
        topCountriesResult,
        userGrowthResult,
        systemHealthResult,
        pollAnalyticsResult,
        triviaAnalyticsResult
      ] = await Promise.all([
        AdminService.getPlatformStats(dateOptions),
        AdminService.getRecentActivity(10, dateOptions),
        AdminService.getTopCountries(5, dateOptions),
        AdminService.getUserGrowthData(7, dateOptions),
        AdminService.getSystemHealth(),
        AdminService.getPollAnalytics(dateOptions),
        AdminService.getTriviaAnalytics(dateOptions)
      ]);

      if (platformStatsResult.error) {
        errorToast(`Failed to fetch platform stats: ${platformStatsResult.error}`);
      } else {
        setStats(platformStatsResult.data);
      }

      if (recentActivityResult.error) {
        errorToast(`Failed to fetch recent activity: ${recentActivityResult.error}`);
      } else {
        setRecentActivity(recentActivityResult.data || []);
      }

      if (topCountriesResult.error) {
        errorToast(`Failed to fetch top countries: ${topCountriesResult.error}`);
      } else {
        setTopCountries(topCountriesResult.data || []);
      }

      if (userGrowthResult.error) {
        errorToast(`Failed to fetch user growth data: ${userGrowthResult.error}`);
      } else {
        setUserGrowth(userGrowthResult.data || []);
      }

      if (systemHealthResult.error) {
        errorToast(`Failed to fetch system health: ${systemHealthResult.error}`);
      } else {
        setSystemHealth(systemHealthResult.data);
      }
      
      if (pollAnalyticsResult.error) {
        errorToast(`Failed to fetch poll analytics: ${pollAnalyticsResult.error}`);
      } else {
        setPollAnalytics(pollAnalyticsResult.data);
      }
      
      if (triviaAnalyticsResult.error) {
        errorToast(`Failed to fetch trivia analytics: ${triviaAnalyticsResult.error}`);
      } else {
        setTriviaAnalytics(triviaAnalyticsResult.data);
      }
      
      if (isFiltering) {
        successToast('Data filtered successfully');
        setIsFiltering(false);
      }
    } catch (err) {
      errorToast('An error occurred while fetching dashboard data');
      console.error(err);
      setIsFiltering(false);
    } finally {
      setLoading(false);
    }
  };
  
  const exportData = (dataType: 'activity' | 'countries' | 'growth' | 'polls' | 'trivia') => {
    try {
      let data;
      let filename;
      
      switch (dataType) {
        case 'activity':
          data = formatDataForExport('activity', recentActivity);
          filename = 'recent-activity.csv';
          break;
        case 'countries':
          data = formatDataForExport('countries', topCountries);
          filename = 'top-countries.csv';
          break;
        case 'growth':
          data = formatDataForExport('growth', userGrowth);
          filename = 'user-growth.csv';
          break;
        case 'polls':
          if (!pollAnalytics) return;
          data = [
            ...formatDataForExport('polls', [{ 
              category: 'Total Polls', 
              count: pollAnalytics.totalPolls 
            }, { 
              category: 'Active Polls', 
              count: pollAnalytics.activePolls 
            }]),
            { Category: '' }, // Empty row as separator
            { Category: 'Polls by Category' },
            ...pollAnalytics.pollsByCategory.map((item: any) => ({
              Category: item.category,
              Count: item.count
            })),
            { Category: '' }, // Empty row as separator
            { Category: 'Votes by Day' },
            ...pollAnalytics.votesByDay.map((item: any) => ({
              Date: item.date,
              Votes: item.count
            }))
          ];
          filename = 'poll-analytics.csv';
          break;
        case 'trivia':
          if (!triviaAnalytics) return;
          data = [
            ...formatDataForExport('trivia', [{ 
              difficulty: 'Total Games', 
              count: triviaAnalytics.totalGames,
              score: 'N/A'
            }, { 
              difficulty: 'Total Questions', 
              count: triviaAnalytics.totalQuestions,
              score: 'N/A'
            }]),
            { Difficulty: '' }, // Empty row as separator
            { Difficulty: 'Completions by Difficulty' },
            ...triviaAnalytics.completionsByDifficulty.map((item: any) => ({
              Difficulty: item.difficulty,
              Completions: item.count
            })),
            { Difficulty: '' }, // Empty row as separator
            { Difficulty: 'Average Scores' },
            ...triviaAnalytics.averageScores.map((item: any) => ({
              Difficulty: item.difficulty,
              'Average Score': `${item.score}%`
            }))
          ];
          filename = 'trivia-analytics.csv';
          break;
        default:
          return;
      }
      
      // Add date range to filename
      const dateRange = `${startDate}_to_${endDate}`;
      const filenameWithDate = filename.replace('.csv', `_${dateRange}.csv`);
      
      downloadCSV(data, filenameWithDate);
      successToast(`Data exported to ${filenameWithDate}`);
    } catch (err) {
      errorToast('Failed to export data');
      console.error(err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  // Quick stats for overview
  const quickStats = [
    {
      label: 'Total Users',
      value: stats?.totalUsers.toLocaleString() || '0',
      change: `+${stats?.recentSignups || 0} this period`,
      icon: Users,
      color: 'from-primary-500 to-primary-600'
    },
    {
      label: 'Active Polls',
      value: stats?.totalPolls.toLocaleString() || '0',
      change: `${stats?.totalVotes.toLocaleString() || 0} votes`,
      icon: BarChart3,
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      label: 'Points Distributed',
      value: stats?.totalPoints.toLocaleString() || '0',
      change: `${stats?.activeUsers || 0} active users`,
      icon: Award,
      color: 'from-accent-500 to-accent-600'
    },
    {
      label: 'Revenue',
      value: '$8,450',
      change: '+12% this period',
      icon: TrendingUp,
      color: 'from-success-500 to-success-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance and user engagement metrics</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={dateRangePreset}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-sm"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="year">Last year</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRangePreset('custom');
              }}
              className="border border-gray-200 rounded-lg p-2 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRangePreset('custom');
              }}
              className="border border-gray-200 rounded-lg p-2 text-sm"
            />
          </div>
          
          <button
            onClick={applyDateFilter}
            disabled={loading || isFiltering}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isFiltering ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            <span>Apply Filter</span>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'polls', label: 'Poll Analytics', icon: BarChart3 },
            { key: 'trivia', label: 'Trivia Analytics', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 mr-1 text-success-500" />
                      <span className="text-sm text-success-600">
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={`bg-gradient-to-r ${metric.color} p-3 rounded-lg`}>
                    <metric.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Growth Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">User Growth</h2>
                <button
                  onClick={() => exportData('growth')}
                  className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <div className="h-64 flex items-end justify-between space-x-2">
                {userGrowth.map((day, index) => {
                  const maxHeight = Math.max(...userGrowth.map(d => d.count), 1);
                  const height = (day.count / maxHeight) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-primary-600 hover:to-primary-500 relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {day.count} new users
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Top Countries by Users</h2>
                <button
                  onClick={() => exportData('countries')}
                  className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <div className="space-y-4">
                {topCountries.map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {country.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                <button
                  onClick={() => exportData('activity')}
                  className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'user' ? 'bg-primary-100' :
                      activity.type === 'poll' ? 'bg-secondary-100' :
                      activity.type === 'moderation' ? 'bg-warning-100' :
                      activity.type === 'system' ? 'bg-success-100' : 'bg-gray-100'
                    }`}>
                      {activity.type === 'user' && <Users className="h-4 w-4 text-primary-600" />}
                      {activity.type === 'poll' && <BarChart3 className="h-4 w-4 text-secondary-600" />}
                      {activity.type === 'moderation' && <AlertTriangle className="h-4 w-4 text-warning-600" />}
                      {activity.type === 'system' && <Database className="h-4 w-4 text-success-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{activity.message}</p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))}

                {recentActivity.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No recent activity to display</p>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Health */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Platform Health</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Server Status</span>
                  </div>
                  <span className="text-success-600 font-semibold">
                    {systemHealth?.serverStatus === 'operational' ? 'Operational' : 
                     systemHealth?.serverStatus === 'degraded' ? 'Degraded' : 'Down'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Database</span>
                  </div>
                  <span className="text-success-600 font-semibold">
                    {systemHealth?.databaseStatus === 'healthy' ? 'Healthy' : 
                     systemHealth?.databaseStatus === 'issues' ? 'Issues Detected' : 'Down'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">API Response Time</span>
                  </div>
                  <span className="text-warning-600 font-semibold">{systemHealth?.apiResponseTime || 0}ms</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">Uptime</span>
                  </div>
                  <span className="text-success-600 font-semibold">{systemHealth?.uptime || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Poll Analytics Tab Content */}
      {activeTab === 'polls' && pollAnalytics && (
        <div className="space-y-8">
          {/* Poll Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Poll Statistics</h2>
                <button
                  onClick={() => exportData('polls')}
                  className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Polls</span>
                    <span className="text-xl font-bold text-gray-900">{pollAnalytics.totalPolls}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Polls</span>
                    <span className="text-xl font-bold text-gray-900">{pollAnalytics.activePolls}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Polls by Category</h2>
              <div className="space-y-3">
                {pollAnalytics.pollsByCategory.slice(0, 5).map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{category.category}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-secondary-500 h-2 rounded-full"
                          style={{ width: `${(category.count / pollAnalytics.totalPolls) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">
                        {category.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Votes by Day Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Votes by Day</h2>
            <div className="h-64 flex items-end justify-between space-x-2">
              {pollAnalytics.votesByDay.map((day: any, index: number) => {
                const maxVotes = Math.max(...pollAnalytics.votesByDay.map((d: any) => d.count), 1);
                const height = (day.count / maxVotes) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-secondary-500 to-secondary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-secondary-600 hover:to-secondary-500 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {day.count} votes
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
              
              {pollAnalytics.votesByDay.length === 0 && (
                <div className="w-full flex items-center justify-center h-full">
                  <p className="text-gray-500">No vote data available for this period</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Trivia Analytics Tab Content */}
      {activeTab === 'trivia' && triviaAnalytics && (
        <div className="space-y-8">
          {/* Trivia Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Trivia Statistics</h2>
                <button
                  onClick={() => exportData('trivia')}
                  className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Games</span>
                    <span className="text-xl font-bold text-gray-900">{triviaAnalytics.totalGames}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Questions</span>
                    <span className="text-xl font-bold text-gray-900">{triviaAnalytics.totalQuestions}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Completions by Difficulty</h2>
              <div className="space-y-3">
                {triviaAnalytics.completionsByDifficulty.map((item: any, index: number) => {
                  const totalCompletions = triviaAnalytics.completionsByDifficulty.reduce(
                    (sum: number, curr: any) => sum + curr.count, 0
                  );
                  const percentage = totalCompletions > 0 
                    ? (item.count / totalCompletions) * 100 
                    : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700 capitalize">{item.difficulty}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              item.difficulty === 'easy' ? 'bg-success-500' :
                              item.difficulty === 'medium' ? 'bg-warning-500' :
                              'bg-error-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Average Scores Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Average Scores by Difficulty</h2>
            <div className="h-64 flex items-end justify-center space-x-12">
              {triviaAnalytics.averageScores.map((item: any, index: number) => {
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-32 rounded-t-md mb-2 transition-all duration-500 relative group ${
                        item.difficulty === 'easy' ? 'bg-success-500 hover:bg-success-600' :
                        item.difficulty === 'medium' ? 'bg-warning-500 hover:bg-warning-600' :
                        'bg-error-500 hover:bg-error-600'
                      }`}
                      style={{ height: `${item.score}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.score}% average score
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.score}%
                    </span>
                  </div>
                );
              })}
              
              {triviaAnalytics.averageScores.length === 0 && (
                <div className="w-full flex items-center justify-center h-full">
                  <p className="text-gray-500">No score data available for this period</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};