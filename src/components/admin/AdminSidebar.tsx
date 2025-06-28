import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  Settings,
  LogOut,
  Zap,
  Gift,
  DollarSign,
  FileImage
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type AdminSection = 'overview' | 'users' | 'content' | 'analytics' | 'moderation' | 'settings' | 'rewards' | 'payouts' | 'marketing';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  activeSection, 
  onSectionChange 
}) => {
  const { signOut, profile } = useAuth();

  const menuItems = [
    {
      id: 'overview' as AdminSection,
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Dashboard overview'
    },
    {
      id: 'users' as AdminSection,
      label: 'User Management',
      icon: Users,
      description: 'Manage users and roles'
    },
    {
      id: 'content' as AdminSection,
      label: 'Content Management',
      icon: FileText,
      description: 'Manage polls and trivia'
    },
    {
      id: 'analytics' as AdminSection,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Platform analytics'
    },
    {
      id: 'moderation' as AdminSection,
      label: 'Moderation',
      icon: Shield,
      description: 'Content moderation'
    },
    {
      id: 'rewards' as AdminSection,
      label: 'Reward Store',
      icon: Gift,
      description: 'Manage rewards and redemptions'
    },
    {
      id: 'payouts' as AdminSection,
      label: 'Payout Management',
      icon: DollarSign,
      description: 'Manage ambassador payouts'
    },
    {
      id: 'marketing' as AdminSection,
      label: 'Marketing Materials',
      icon: FileImage,
      description: 'Manage marketing assets'
    },
    {
      id: 'settings' as AdminSection,
      label: 'Settings',
      icon: Settings,
      description: 'System settings'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PulseEarn</h1>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${
                  activeSection === item.id ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* User Info & Sign Out */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
                {(profile?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{profile?.name || 'Admin'}</p>
                <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};