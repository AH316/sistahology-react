/**
 * ProtectedRoute - Simplified with Supabase-native auth
 *
 * With AuthContext using Supabase's onAuthStateChange, tab recovery
 * is automatic. No watchdog timers or retry logic needed.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  // Show loading while auth is initializing
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gerbera-hero">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg drop-shadow-lg">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
