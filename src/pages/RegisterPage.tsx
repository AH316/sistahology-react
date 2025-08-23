import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { Heart, User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import Navigation from '../components/Navigation';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    match: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Clear error when component mounts
    clearError();
  }, [clearError]);

  useEffect(() => {
    // Update password validation
    setPasswordValidation({
      length: formData.password.length >= 6,
      match: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
    });
  }, [formData.password, formData.confirmPassword]);

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
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.confirmPassword.trim()) {
      return;
    }

    const result = await register(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.email.trim() && 
           passwordValidation.length && 
           passwordValidation.match;
  };

  return (
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

        {/* Register Form */}
        <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sistah-pink to-sistah-rose rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">Join Sistahology</h1>
            <p className="text-white/90 drop-shadow-lg">Create your account and start your journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  placeholder="Create a password"
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-700" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-700 hover:text-gray-900" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-700 hover:text-gray-900" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    passwordValidation.length ? 'bg-green-500' : 'bg-white/30'
                  }`}>
                    {passwordValidation.length && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={`text-sm ${
                    passwordValidation.length ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    At least 6 characters
                  </span>
                </div>
                
                {formData.confirmPassword && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordValidation.match ? 'bg-green-500' : 'bg-white/30'
                    }`}>
                      {passwordValidation.match && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className={`text-sm ${
                      passwordValidation.match ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Passwords match
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 mt-6
                ${isLoading || !isFormValid()
                  ? 'bg-white/20 text-white/60 cursor-not-allowed' 
                  : 'btn-primary hover:shadow-xl transform hover:-translate-y-0.5'
                }
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" fill="currentColor" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <div>
              <span className="text-white/80 text-sm drop-shadow-lg">Already have an account? </span>
              <Link 
                to="/login" 
                className="text-white/95 hover:text-pink-200 font-medium text-sm drop-shadow-lg underline"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            By creating an account, you agree to our privacy policy.<br />
            Your data is stored securely on your device only.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;