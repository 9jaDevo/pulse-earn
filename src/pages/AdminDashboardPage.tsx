import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/admin/AdminDashboard';

export const AdminDashboardPage: React.FC = () => {
  const { profile } = useAuth();

  return <AdminDashboard />;
};