import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isReady, ensureSessionLoaded, retryAuth } = useAuth();
  const location = useLocation();
  const timeoutRef = useRef<number | null>(null);
  const [watchdogFailed, setWatchdogFailed] = useState(false);

  // Watchdog timer for stuck auth states
  useEffect(() => {
    if (isReady) return; // Already ready, no watchdog needed
    
    // Set 15 second watchdog
    timeoutRef.current = window.setTimeout(() => {
      console.warn('[GUARD] Auth watchdog triggered - retrying authentication');
      console.debug('auth:retry - watchdog triggered retry');
      setWatchdogFailed(true);
      retryAuth();
    }, 15000);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isReady, retryAuth]);

  // Bootstrap session on mount
  useEffect(() => {
    console.debug('auth:start - ProtectedRoute mounting, ensuring session loaded');
    let mounted = true;
    (async () => { 
      await ensureSessionLoaded(); 
      if (mounted && timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    })();
    return () => { mounted = false; };
  }, [ensureSessionLoaded]);

  // Show loading while auth is not ready
  if (!isReady) {
    console.debug(`[GUARD] Auth not ready - isReady: ${isReady}, isAuthenticated: ${isAuthenticated}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gerbera-hero">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg drop-shadow-lg">
            {watchdogFailed ? 'Retrying authentication...' : 'Checking authentication...'}
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