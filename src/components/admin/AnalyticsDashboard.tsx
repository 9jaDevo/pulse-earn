import React from 'react';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  DollarSign,
  Calendar,
  Globe,
  Award,
  Activity
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  // Mock analytics data
  const metrics = [
    {
      label: 'Total Users',
      value: '12,450',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'from-primary-500 to-primary-600'
    },
    {
      label: 'Daily Active Users',
      value: '3,247',
      change: '+12.5%',
      trend: 'up',
      icon: Activity,
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      label: 'Total Polls',
      value: '1,847',
      change: '+5.1%',
      trend: 'up',
      icon: BarChart3,
      color: 'from-accent-500 to-accent-600'
    },
    {
      label: 'Revenue',
      value: '$8,450',
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-success-500 to-success-600'
    }
  ];

  const topCountries = [
    { country: 'United States', users: 3247, percentage: 26.1 },
    { country: 'United Kingdom', users: 1892, percentage: 15.2 },
    { country: 'Canada', users: 1456, percentage: 11.7 },
    { country: 'Germany', users: 1234, percentage: 9.9 },
    { country: 'France', users: 987, percentage: 7.9 }
  ];

  const recentPolls = [
    { title: 'Best Programming Language 2025', votes: 1247, created: '2 hours ago' },
    { title: 'Favorite Food in Italy', votes: 892, created: '5 hours ago' },
    { title: 'Climate Change Solutions', votes: 1456, created: '1 day ago' },
    { title: 'Future of Remote Work', votes: 2134, created: '2 days ago' }
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
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    metric.trend === 'up' ? 'text-success-500' : 'text-error-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-success-600' : 'text-error-600'
                  }`}>
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
            {[420, 380, 450, 520, 480, 600, 650].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md mb-2 transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                  style={{ height: `${(height / 650) * 100}%` }}
                  title={`${height} new users`}
                ></div>
                <span className="text-xs text-gray-500">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
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
                    {country.users.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Polls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Polls</h2>
          <div className="space-y-4">
            {recentPolls.map((poll, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{poll.title}</p>
                  <p className="text-sm text-gray-500">{poll.created}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">{poll.votes}</p>
                  <p className="text-xs text-gray-500">votes</p>
                </div>
              </div>
            ))}
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
              <span className="text-success-600 font-semibold">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Database</span>
              </div>
              <span className="text-success-600 font-semibold">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                <span className="font-medium text-gray-900">API Response Time</span>
              </div>
              <span className="text-warning-600 font-semibold">245ms</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Uptime</span>
              </div>
              <span className="text-success-600 font-semibold">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};