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
  Database
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';

export const AnalyticsDashboard: React.FC = () => {
  const { errorToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topCountries, setTopCountries] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        platformStatsResult,
        recentActivityResult,
        topCountriesResult,
        userGrowthResult,
        systemHealthResult
      ] = await Promise.all([
        AdminService.getPlatformStats(),
        AdminService.getRecentActivity(5),
        AdminService.getTopCountries(5),
        AdminService.getUserGrowthData(7),
        AdminService.getSystemHealth()
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
    } catch (err) {
      errorToast('An error occurred while fetching dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      change: `+${stats?.recentSignups || 0} this month`,
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
      change: '+12% this month',
      icon: TrendingUp,
      color: 'from-success-500 to-success-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor platform performance and user engagement metrics</p>
      </div>

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
          <h2 className="text-lg font-bold text-gray-900 mb-6">User Growth (Last 7 Days)</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {userGrowth.map((day, index) => {
              const maxHeight = Math.max(...userGrowth.map(d => d.count), 1);
              const height = (day.count / maxHeight) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                    style={{ height: `${height}%` }}
                    title={`${day.count} new users`}
                  ></div>
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
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Countries by Users</h2>
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
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h2>
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
    </div>
  );
};