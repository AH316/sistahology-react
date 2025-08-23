import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, ensureSessionLoaded } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  // Check session ONCE on mount, then stop showing placeholder
  useEffect(() => {
    let mounted = true;
    (async () => { 
      await ensureSessionLoaded(); 
      if (mounted) {
        setChecking(false);
        console.log('[GUARD] session check completed');
      }
    })();
    return () => { mounted = false; };
  }, [ensureSessionLoaded]);

  // Local loading state
  if (checking) {
    console.log('[GUARD] checking/loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gerbera-hero">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg drop-shadow-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[GUARD] redirect to /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('[GUARD] render children');
  return <>{children}</>;
};

export default ProtectedRoute;