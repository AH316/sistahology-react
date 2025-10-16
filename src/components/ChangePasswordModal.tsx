import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { isSessionExpired } from '../lib/session';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPassword: string) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate new password
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      setErrors({ newPassword: newPasswordError });
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsSaving(true);

    try {
      await onSuccess(newPassword);
      // Clear form after successful change
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      console.error('Error changing password:', err);

      // Detect session expiry
      if (isSessionExpired(err)) {
        setErrors({ general: 'Your session expired. Please log in again.' });
        navigate('/login');
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setErrors({ general: errorMessage });
    } finally {
      setIsSaving(false); // Always clear spinner
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password Input */}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-800 mb-2">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500 ${
                errors.newPassword
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-gray-200 focus:ring-sistah-pink'
              }`}
              autoFocus
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-800 hover:text-gray-900"
              disabled={isSaving}
            >
              {showNewPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.newPassword}</p>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-800">Password must contain:</p>
            <ul className="text-xs text-gray-800 list-disc list-inside space-y-0.5">
              <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                One number
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-800 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500 ${
                errors.confirmPassword
                  ? 'border-red-300 focus:ring-red-300'
                  : 'border-gray-200 focus:ring-sistah-pink'
              }`}
              disabled={isSaving}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-800 hover:text-gray-900"
              disabled={isSaving}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
          )}
          {!errors.confirmPassword && confirmPassword && newPassword === confirmPassword && (
            <p className="text-xs text-green-600 mt-1">Passwords match</p>
          )}
        </div>

        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/20">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="px-5 py-2.5 text-gray-800 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !newPassword || !confirmPassword}
            className={`
              px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
              focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
              ${isSaving || !newPassword || !confirmPassword
                ? 'bg-gray-400/60 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-sistah-pink to-sistah-rose text-white hover:shadow-lg transform hover:-translate-y-0.5'
              }
            `}
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Changing...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
