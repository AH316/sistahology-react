import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, CheckCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import { usePageTitle } from '../hooks/usePageTitle';
import { supabase } from '../lib/supabase';

const ForgotPasswordPage: React.FC = () => {
  usePageTitle('Reset Password');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
      }

      // Always show success (security best practice - don't reveal if email exists)
      setIsSubmitted(true);
    } catch (err) {
      console.error('Unexpected error:', err);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
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

        {/* Reset Password Form */}
        <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30">
          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-sistah-pink to-sistah-rose rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">Forgot Password?</h1>
                <p className="text-white/90 drop-shadow-lg">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              {/* Important Notice */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="font-semibold text-blue-900 mb-2">🔒 Secure Password Reset</h2>
                <p className="text-blue-800 text-sm leading-relaxed">
                  We'll send a secure password reset link to your email.
                  Click the link to create a new password for your account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      aria-required="true"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm transition-all duration-200"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2
                    ${isLoading || !email.trim()
                      ? 'bg-white/20 text-white/60 cursor-not-allowed' 
                      : 'btn-primary hover:shadow-xl transform hover:-translate-y-0.5'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Get Recovery Instructions</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Instructions Sent!</h1>
                <p className="text-gray-800 mb-6 leading-relaxed">
                  We've sent password recovery instructions to <strong>{email}</strong>.
                </p>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                  <p className="text-blue-700 text-sm">
                    💡 <strong>Next steps:</strong> Check your email inbox (and spam folder) for the password reset link. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-white/20 text-center">
            <div>
              <span className="text-gray-800 text-sm">Remember your password? </span>
              <Link
                to="/login"
                className="text-sistah-pink hover:text-sistah-rose font-medium text-sm"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-800 text-sm">
            Your privacy is our priority - all data is encrypted and securely stored
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ForgotPasswordPage;