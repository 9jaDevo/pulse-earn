import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  FileText, 
  Award,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { UserManagement } from '../components/admin/UserManagement';
import { ContentManagement } from '../components/admin/ContentManagement';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { ModerationTools } from '../components/admin/ModerationTools';
import { SystemSettings } from '../components/admin/SystemSettings';
import { AdminService } from '../services/adminService';
import { useToast } from '../hooks/useToast';

type AdminSection = 'overview' | 'users' | 'content' | 'analytics' | 'moderation' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const { errorToast } = useToast();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topCountries, setTopCountries] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    if (activeSection === 'overview') {
      fetchStats();
    }
  }, [activeSection]);

  const fetchStats = async () => {
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

  const renderOverview = () => {
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
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.name || 'Admin'}!
          </h1>
          <p className="text-primary-100">
            Here's what's happening with your platform today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-success-600 font-medium">{stat.change}</p>
                </div>
                <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
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
                    {activity.type === 'user' && <UserCheck className="h-4 w-4 text-primary-600" />}
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveSection('users')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Manage Users</h3>
            </div>
            <p className="text-gray-600">View and manage user accounts, roles, and permissions.</p>
          </button>

          <button
            onClick={() => setActiveSection('content')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-secondary-100 p-3 rounded-lg group-hover:bg-secondary-200 transition-colors">
                <FileText className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Content Management</h3>
            </div>
            <p className="text-gray-600">Manage polls, trivia questions, and platform content.</p>
          </button>

          <button
            onClick={() => setActiveSection('analytics')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-accent-100 p-3 rounded-lg group-hover:bg-accent-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">View Analytics</h3>
            </div>
            <p className="text-gray-600">Monitor platform performance and user engagement.</p>
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'content':
        return <ContentManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'moderation':
        return <ModerationTools />;
      case 'settings':
        return <SystemSettings />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />

        {/* Main Content */}
        <div className="flex-1 lg:pl-1">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};