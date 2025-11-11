import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import LoadingSpinner from './ui/LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, isReady } = useAuth();

  // Show loading while auth is not ready
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gerbera-hero">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg drop-shadow-lg">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
