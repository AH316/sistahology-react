import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCw, Edit2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { profileService } from '../lib/supabase-database';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';
import PageErrorBoundary from '../components/PageErrorBoundary';
import Button from '../components/ui/Button';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useToast, ToastContainer } from '../components/ui/Toast';

interface ProfileData {
  email: string;
  role: string;
  displayName: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const { toasts, removeToast, showSuccess } = useToast();

  const fetchProfileData = async () => {
    try {
      setError(null);
      
      // Get user from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Failed to get user: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Extract role from app_metadata (default to 'user')
      const role = user.app_metadata?.role || 'user';
      
      // Fetch profile name in parallel
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .limit(1)
        .single();
      
      // Don't throw on profile error - just use null for name
      const displayName = profileError ? null : profile?.name || null;
      
      setProfileData({
        email: user.email || '',
        role,
        displayName
      });
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      // Force navigation even if sign out fails
      navigate('/');
    }
  };

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    await fetchProfileData();
  };

  const handleUpdateName = async (newName: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update profile name
      const result = await profileService.updateProfileName(user.id, newName);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update display name');
      }

      // Update local state
      setProfileData(prev => prev ? { ...prev, displayName: newName } : null);

      showSuccess('Display name updated successfully');
    } catch (err) {
      console.error('Error updating display name:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update display name';

      // Map specific error messages
      if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        throw new Error("You don't have permission to update this profile.");
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error('Unable to update profile. Please check your connection.');
      }

      throw new Error(errorMessage);
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      showSuccess('Password changed successfully');
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';

      // Map specific error messages
      if (errorMessage.includes('weak') || errorMessage.includes('strength')) {
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error('Unable to change password. Please check your connection.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        throw new Error("You don't have permission to change this password.");
      }

      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <div className="flex items-center justify-center pt-20">
          <div className="glass rounded-3xl p-8 text-center backdrop-blur-lg border border-white/30">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/80 drop-shadow-lg">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 pt-20">
          <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30 text-center">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-4">Profile</h2>
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-white font-medium">Error loading profile</p>
              <p className="text-white/80 text-sm mt-1">{error}</p>
            </div>
            <Button 
              onClick={() => fetchProfileData()}
              variant="primary"
              className="mr-4"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="secondary"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="Profile">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <Breadcrumbs items={[{ label: 'Profile' }]} />

        <main className="max-w-2xl mx-auto px-4 pt-20">
          <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-8">Profile</h1>
            
            {profileData && (
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <p className="bg-white/10 rounded-lg px-4 py-3 font-mono text-white border border-white/20">
                    {profileData.email}
                  </p>
                </div>

                {/* Role Badge */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Account Role
                  </label>
                  <div className="flex items-center">
                    <span 
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        profileData.role === 'admin' 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                          : 'bg-gradient-to-r from-sistah-pink to-sistah-rose text-white'
                      }`}
                      aria-label={`Current role: ${profileData.role}`}
                    >
                      {profileData.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Display Name
                  </label>
                  <div className="flex items-center gap-3">
                    <p className="flex-1 bg-white/10 rounded-lg px-4 py-3 text-white border border-white/20">
                      {profileData.displayName || '—'}
                    </p>
                    <button
                      onClick={() => setIsEditNameModalOpen(true)}
                      className="px-4 py-3 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 rounded-lg font-medium transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                      aria-label="Edit display name"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setIsChangePasswordModalOpen(true)}
                      variant="outline"
                      className="flex-1 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 border-white hover:border-white focus:ring-white"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>

                    <Button
                      onClick={handleRefreshSession}
                      variant="outline"
                      disabled={isRefreshing}
                      loading={isRefreshing}
                      className="flex-1 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 border-white hover:border-white focus:ring-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Account Data
                    </Button>
                  </div>

                  <Button
                    onClick={handleSignOut}
                    variant="primary"
                    className="w-full bg-pink-600 hover:bg-pink-700 border-pink-600 hover:border-pink-700 text-white focus:ring-pink-500"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Modals */}
        <EditProfileModal
          isOpen={isEditNameModalOpen}
          onClose={() => setIsEditNameModalOpen(false)}
          onSuccess={handleUpdateName}
          currentName={profileData?.displayName || null}
        />

        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSuccess={handleChangePassword}
        />
      </div>
    </PageErrorBoundary>
  );
};

export default ProfilePage;