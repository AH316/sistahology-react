import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import { User } from 'lucide-react';
import { isSessionExpired } from '../lib/session';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string) => Promise<void>;
  currentName: string | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentName
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, currentName]);

  const validateName = (value: string): string | null => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return 'Display name is required';
    }

    if (trimmedValue.length < 1 || trimmedValue.length > 50) {
      return 'Display name must be between 1 and 50 characters';
    }

    // Allow letters, numbers, spaces, hyphens, and apostrophes
    const validNamePattern = /^[a-zA-Z0-9\s\-']+$/;
    if (!validNamePattern.test(trimmedValue)) {
      return 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate name
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedName = name.trim();

    // Check if name actually changed
    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      await onSuccess(trimmedName);
      onClose();
    } catch (err) {
      console.error('Error updating display name:', err);

      // Detect session expiry
      if (isSessionExpired(err)) {
        setError('Your session expired. Please log in again.');
        navigate('/login');
        return;
      }

      setError(err instanceof Error ? err.message : 'Failed to update display name');
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
      title="Edit Display Name"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display Name Input */}
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium text-gray-800 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500"
            autoFocus
            disabled={isSaving}
          />
          <p className="text-xs text-gray-800 mt-1">
            {name.length}/50 characters
          </p>
          <p className="text-xs text-gray-800 mt-1">
            Can contain letters, numbers, spaces, hyphens, and apostrophes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
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
            disabled={isSaving || !name.trim()}
            className={`
              px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
              focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
              ${isSaving || !name.trim()
                ? 'bg-gray-400/60 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-sistah-pink to-sistah-rose text-white hover:shadow-lg transform hover:-translate-y-0.5'
              }
            `}
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
