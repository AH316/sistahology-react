import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import Navigation from '../components/Navigation';
import PageErrorBoundary from '../components/PageErrorBoundary';
import FormErrorBoundary from '../components/FormErrorBoundary';
import { usePageTitle } from '../hooks/usePageTitle';
import { validateTokenForDisplay, consumeAdminToken } from '../services/adminTokens';
import { showToast } from '../utils/toast';

const LoginPage: React.FC = () => {
  usePageTitle('Sign In');
  const { login, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Parse admin token from URL
  const [urlToken] = useState(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    return params.get('token') || null;
  });
  const [tokenValidation, setTokenValidation] = useState<{ email: string; isValid: boolean } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Remember me preference - defaults to true for new users
  const [rememberMe, setRememberMe] = useState(() => {
    const pref = localStorage.getItem('sistahology-remember-me');
    return pref === null ? true : pref === 'true';
  });

  useEffect(() => {
    // Only clear error on mount, don't include clearError in deps to prevent infinite loop
    clearError();
  }, []); // Empty dependency array

  // Validate admin token on mount if present
  useEffect(() => {
    if (urlToken) {
      validateToken(urlToken);
    }
  }, [urlToken]);

  const validateToken = async (token: string) => {
    try {
      const result = await validateTokenForDisplay(token);
      if (result.success && result.data) {
        const tokenData = result.data;
        setTokenValidation(tokenData);
        if (tokenData.isValid && tokenData.email) {
          // Pre-fill email if token is valid
          setFormData((prev) => ({ ...prev, email: tokenData.email }));
        }
      }
    } catch (error) {
      console.error('Failed to validate token:', error);
    }
  };

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

      // On successful login, save remember-me preference
      if (result.success) {
        localStorage.setItem('sistahology-remember-me', String(rememberMe));
      }

      // If login successful and admin token present, consume it
      if (result.success && result.data && urlToken) {
        const tokenResult = await consumeAdminToken(urlToken, result.data.id, formData.email);
        if (tokenResult.success && tokenResult.data) {
          showToast('Admin privileges activated!', 'success');
        } else {
          showToast('Login successful, but failed to activate admin privileges', 'error');
        }
      }

    } catch (error) {
      console.error('[DEBUG] LoginPage: login error:', error);
    } finally {
      setSubmitting(false);
    }
    // No navigation here - ProtectedRoute guard will handle redirect when isAuthenticated changes
  };

  return (
    <PageErrorBoundary pageName="Login">
      <div className="font-sans bg-gerbera-hero min-h-screen w-full overflow-x-hidden">
        {/* Shared Navigation */}
        <Navigation />

      {/* Main Content */}
      <main className="flex items-center justify-center px-4 sm:px-6 py-20">
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-pink-300 rounded-full opacity-60 floating-flower"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400 rounded-full opacity-40 floating-flower" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-3 h-3 bg-pink-500 rounded-full opacity-70 floating-flower" style={{animationDelay: '0.5s'}}></div>

        <div className="w-full max-w-md">

        {/* Admin Token Banner */}
        {urlToken && tokenValidation?.isValid && (
          <div className="mb-6 glass rounded-xl p-4 border-2 border-purple-300/50 backdrop-blur-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold drop-shadow-lg">Admin Login</h3>
                <p className="text-white/90 text-sm drop-shadow">
                  You are logging in with admin privileges for:{' '}
                  <strong className="text-white">{tokenValidation.email}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Invalid Token Warning */}
        {urlToken && tokenValidation && !tokenValidation.isValid && (
          <div className="mb-6 glass rounded-xl p-4 border-2 border-red-300/50 backdrop-blur-lg">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-red-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold drop-shadow-lg">Invalid or Expired Token</h3>
                <p className="text-white/90 text-sm drop-shadow">
                  This admin token is invalid or has expired. You can still login normally.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <FormErrorBoundary formName="Login Form">
          <div className="glass rounded-3xl p-6 sm:p-8 backdrop-blur-lg border border-white/30">
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
                  aria-required="true"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={urlToken !== null && tokenValidation?.isValid}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>
              {urlToken && tokenValidation?.isValid && (
                <p className="mt-1 text-xs text-white/90 drop-shadow">
                  Email is pre-filled from your admin invitation
                </p>
              )}
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
                  aria-required="true"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-3 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-700 hover:text-gray-900" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-700 hover:text-gray-900" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-3 mt-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 rounded border-white/40 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer accent-pink-500"
              />
              <label htmlFor="rememberMe" className="text-white drop-shadow-lg text-sm cursor-pointer">
                Remember me on this device
              </label>
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
      </main>
      </div>
    </PageErrorBoundary>
  );
};

export default LoginPage;