import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { UserManagement } from './UserManagement';
import { ContentManagement } from './ContentManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { ModerationTools } from './ModerationTools';
import { SystemSettings } from './SystemSettings';
import { RewardStoreManagement } from './RewardStoreManagement';
import { OverviewDashboard } from './OverviewDashboard';
import { PayoutManagement } from './PayoutManagement';

type AdminSection = 'overview' | 'users' | 'content' | 'analytics' | 'moderation' | 'settings' | 'rewards' | 'payouts';

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const location = useLocation();

  // Parse section from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') as AdminSection | null;
    if (section && ['overview', 'users', 'content', 'analytics', 'moderation', 'settings', 'rewards', 'payouts'].includes(section)) {
      setActiveSection(section);
    }
  }, [location]);

  // Update URL when section changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('section', activeSection);
    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeSection, location.pathname]);

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
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
      case 'rewards':
        return <RewardStoreManagement />;
      case 'payouts':
        return <PayoutManagement />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange} 
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