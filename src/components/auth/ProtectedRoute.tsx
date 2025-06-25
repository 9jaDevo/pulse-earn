import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { useToast } from '../../hooks/useToast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'moderator' | 'ambassador' | 'admin';
  message?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user',
  message = 'Please sign in to access this page'
}) => {
  const { user, profile, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const { errorToast } = useToast();

  React.useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
      errorToast(message);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Check role permissions
  const roleHierarchy = {
    user: 0,
    moderator: 1,
    ambassador: 2,
    admin: 3
  };

  const userRole = profile?.role || 'user';
  const requiredLevel = roleHierarchy[requiredRole];
  const userLevel = roleHierarchy[userRole];

  if (userLevel < requiredLevel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <p className="text-gray-500">Required role: {requiredRole}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};