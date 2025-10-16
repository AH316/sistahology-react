import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Navigation from '../components/Navigation';
import PageErrorBoundary from '../components/PageErrorBoundary';
import FormErrorBoundary from '../components/FormErrorBoundary';

const LoginPage: React.FC = () => {
  const { login, error, clearError, retryAuth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Only clear error on mount, don't include clearError in deps to prevent infinite loop
    clearError();
  }, []); // Empty dependency array

  // Handle tab visibility changes - retry auth when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[DEBUG] Tab became visible, checking auth state');
        // Small delay to let any ongoing processes complete
        setTimeout(() => {
          retryAuth();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [retryAuth]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      return;
    }

    setSubmitting(true);
    
    try {
      console.log('[DEBUG] LoginPage: attempting login...');
      
      // Add timeout protection to prevent infinite hanging
      const timeoutId = setTimeout(() => {
        console.warn('[DEBUG] LoginPage: login timeout after 30 seconds');
        setSubmitting(false);
      }, 30000); // 30 second timeout
      
      const result = await login(formData);
      clearTimeout(timeoutId);
      
      console.log('[DEBUG] LoginPage: login result:', result.success ? 'success' : 'failed');
      
    } catch (error) {
      console.error('[DEBUG] LoginPage: login error:', error);
    } finally {
      setSubmitting(false);
    }
    // No navigation here - ProtectedRoute guard will handle redirect when isAuthenticated changes
  };

  return (
    <PageErrorBoundary pageName="Login">
      <div className="font-sans bg-gerbera-hero min-h-screen">
        {/* Shared Navigation */}
        <Navigation />

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-20">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-pink-300 rounded-full opacity-60 floating-flower"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400 rounded-full opacity-40 floating-flower" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-pink-500 rounded-full opacity-70 floating-flower" style={{animationDelay: '0.5s'}}></div>

        <div className="w-full max-w-md">

        {/* Login Form */}
        <FormErrorBoundary formName="Login Form">
          <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sistah-pink to-sistah-rose rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">Welcome Back</h1>
            <p className="text-white/90 drop-shadow-lg">Sign in to continue your journaling journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-700 hover:text-gray-900" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-700 hover:text-gray-900" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !formData.email.trim() || !formData.password.trim()}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2
                ${submitting || !formData.email.trim() || !formData.password.trim()
                  ? 'bg-white/20 text-white/60 cursor-not-allowed' 
                  : 'btn-primary hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" fill="currentColor" />
                  <span>Sign In</span>
                </>
              )}
            </button>

          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center space-y-4">
            <Link 
              to="/forgot-password" 
              className="text-sm text-white/90 hover:text-pink-200 font-medium drop-shadow-lg"
            >
              Forgot your password?
            </Link>
            
            <div>
              <span className="text-white/80 text-sm drop-shadow-lg">Don't have an account? </span>
              <Link 
                to="/register" 
                className="text-white/95 hover:text-pink-200 font-medium text-sm drop-shadow-lg underline"
              >
                Sign up here
              </Link>
            </div>
          </div>
          </div>
        </FormErrorBoundary>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-white/90 text-sm drop-shadow-lg">
            Your personal data is stored securely with Supabase
          </p>
        </div>
        </div>
      </div>
      </div>
    </PageErrorBoundary>
  );
};

export default LoginPage;