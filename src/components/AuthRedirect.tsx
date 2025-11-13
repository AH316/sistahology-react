import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/authStore';

interface AuthRedirectProps {
  children: React.ReactNode;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  // If loading, don't redirect yet
  if (isLoading) {
    return <>{children}</>;
  }
  
  // If authenticated and trying to access auth pages, redirect to saved location or home
  const authPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = authPages.includes(location.pathname);

  if (isAuthenticated && isAuthPage) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }
  
  return <>{children}</>;
};

export default AuthRedirect;