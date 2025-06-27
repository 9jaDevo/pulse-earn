import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { UserManagement } from './UserManagement';
import { ContentManagement } from './ContentManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ModerationTools } from './ModerationTools';
import { SystemSettings } from './SystemSettings';
import { RewardStoreManagement } from './RewardStoreManagement';

type AdminSection = 'overview' | 'users' | 'content' | 'analytics' | 'moderation' | 'settings' | 'rewards';

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

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
      case 'rewards':
        return <RewardStoreManagement />;
      default:
        return <AnalyticsDashboard />;
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