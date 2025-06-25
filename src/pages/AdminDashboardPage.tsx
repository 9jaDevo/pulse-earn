import React, { useState } from 'react';
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

type AdminSection = 'overview' | 'users' | 'content' | 'analytics' | 'moderation' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Quick stats for overview
  const quickStats = [
    {
      label: 'Total Users',
      value: '12,450',
      change: '+285 this week',
      icon: Users,
      color: 'from-primary-500 to-primary-600'
    },
    {
      label: 'Active Polls',
      value: '1,247',
      change: '+42 today',
      icon: BarChart3,
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      label: 'Points Distributed',
      value: '2.4M',
      change: '+125K this week',
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

  const recentActivity = [
    { type: 'user', message: 'New user registration: john.doe@email.com', time: '2 minutes ago' },
    { type: 'poll', message: 'Poll "Best Programming Language" reached 1000 votes', time: '15 minutes ago' },
    { type: 'moderation', message: 'Content flagged for review in poll #1247', time: '1 hour ago' },
    { type: 'system', message: 'Daily backup completed successfully', time: '2 hours ago' },
    { type: 'user', message: 'Ambassador tier upgraded: Sarah K. → Gold', time: '3 hours ago' }
  ];

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

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
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