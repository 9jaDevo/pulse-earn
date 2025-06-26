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
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<number[]>([]);
  const [topCountries, setTopCountries] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // Fetch all data in parallel
        const [platformRes, revenueRes, activityRes, growthRes, countriesRes] = await Promise.all([
          AdminService.getPlatformStats(),
          AdminService.getRevenueStats(),
          AdminService.getRecentActivity(),
          AdminService.getUserGrowthData(),
          AdminService.getTopCountries()
        ]);

        if (platformRes.data) {
          setPlatformStats(platformRes.data);
        } else {
          console.error('Failed to fetch platform stats:', platformRes.error);
        }

        if (revenueRes.data) {
          setRevenueStats(revenueRes.data);
        } else {
          console.error('Failed to fetch revenue stats:', revenueRes.error);
        }

        if (activityRes.data) {
          setRecentActivity(activityRes.data);
        } else {
          console.error('Failed to fetch recent activity:', activityRes.error);
        }

        if (growthRes.data) {
          setUserGrowthData(growthRes.data);
        } else {
          console.error('Failed to fetch user growth data:', growthRes.error);
        }

        if (countriesRes.data) {
          setTopCountries(countriesRes.data);
        } else {
          console.error('Failed to fetch top countries:', countriesRes.error);
        }
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        errorToast('Failed to load dashboard data');
      } finally {
        setLoadingStats(false);
      }
    };

    if (activeSection === 'overview') {
      fetchStats();
    }
  }, [activeSection, errorToast]);

  // Quick stats for overview (now dynamic)
  const quickStats = [
    {
      label: 'Total Users',
      value: loadingStats ? '...' : (platformStats?.total_users || 0).toLocaleString(),
      change: loadingStats ? '...' : `+${platformStats?.new_users_today || 0} today`,
      icon: Users,
      color: 'from-primary-500 to-primary-600'
    },
    {
      label: 'Active Polls',
      value: loadingStats ? '...' : (platformStats?.active_polls || 0).toLocaleString(),
      change: loadingStats ? '...' : `+${platformStats?.polls_created_today || 0} today`,
      icon: BarChart3,
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      label: 'Points Distributed',
      value: loadingStats ? '...' : (platformStats?.total_points_distributed || 0).toLocaleString(),
      change: loadingStats ? '...' : 'Total platform points',
      icon: Award,
      color: 'from-accent-500 to-accent-600'
    },
    {
      label: 'Revenue',
      value: loadingStats ? '...' : `$${(revenueStats?.totalRevenue || 0).toFixed(2)}`,
      change: loadingStats ? '...' : `${revenueStats?.monthlyChange >= 0 ? '+' : ''}${revenueStats?.monthlyChange?.toFixed(1) || 0}% this month`,
      icon: TrendingUp,
      color: 'from-success-500 to-success-600'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return UserCheck;
      case 'poll':
        return BarChart3;
      case 'moderation':
        return AlertTriangle;
      case 'system':
        return Database;
      default:
        return Database;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-primary-100 text-primary-600';
      case 'poll':
        return 'bg-secondary-100 text-secondary-600';
      case 'moderation':
        return 'bg-warning-100 text-warning-600';
      case 'system':
        return 'bg-success-100 text-success-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
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

            {/* User Growth Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">User Growth (Last 7 Days)</h2>
              {loadingStats ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between space-x-2">
                  {userGrowthData.map((height, index) => {
                    const maxHeight = Math.max(...userGrowthData, 100); // Ensure at least 100 for scale
                    const percentage = height > 0 ? (height / maxHeight) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                          style={{ height: `${percentage}%` }}
                          title={`${height} new users`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              {loadingStats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading activity...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {React.createElement(getActivityIcon(activity.type), { className: "h-4 w-4" })}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{activity.message}</p>
                        <p className="text-gray-500 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Countries */}
            {!loadingStats && topCountries.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Top Countries by Users</h2>
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
                          {country.userCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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