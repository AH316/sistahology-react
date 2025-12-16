import React, { useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import Modal from './ui/Modal';
import { useJournal } from '../stores/journalStore';
import { useAuth } from '../contexts/AuthContext';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSuccess: () => void;
}

const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSuccess
}) => {
  const { user } = useAuth();
  const { currentJournal, createJournalEntry } = useJournal();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setContent('');
      setError(null);
    }
  }, [isOpen]);

  const formatDisplayDate = (dateString: string): string => {
    // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSave = async () => {
    // Validation
    if (!content.trim()) {
      setError('Entry content cannot be empty');
      return;
    }

    if (content.trim().length < 10) {
      setError('Entry must be at least 10 characters');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to create an entry');
      return;
    }

    if (!currentJournal?.id) {
      setError('No journal selected. Please select a journal first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createJournalEntry({
        userId: user.id,
        journalId: currentJournal.id,
        entryDate: selectedDate,
        content: content.trim()
      });

      if (result) {
        // Success - close modal and trigger refresh
        onSuccess();
        onClose();
      } else {
        // Check for session expiry
        setError('Failed to create entry. Please try again.');
      }
    } catch (err) {
      // Handle session expiry errors
      if (err instanceof Error && err.message.includes('session')) {
        setError('Your session has expired. Please log in again.');
        // Redirect to login after short delay
        setTimeout(() => {
          window.location.href = '/#/login';
        }, 2000);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create entry');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const characterCount = content.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Quick Entry"
      size="lg"
    >
      <div className="space-y-6">
        {/* Date Display */}
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-sistah-pink/20 to-sistah-rose/20 rounded-xl border border-sistah-pink/30">
          <Calendar className="w-5 h-5 text-sistah-pink" />
          <div>
            <p className="text-sm text-white drop-shadow-lg mb-0.5">Entry Date</p>
            <p className="text-base font-semibold text-gray-800">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
        </div>

        {/* Current Journal Display */}
        {currentJournal && (
          <div className="text-sm text-white drop-shadow-lg">
            Writing in: <span className="font-semibold text-white">{currentJournal.journalName}</span>
          </div>
        )}

        {/* Content Textarea */}
        <div>
          <label
            htmlFor="quick-entry-content"
            className="block text-sm font-medium text-white drop-shadow-lg mb-2"
          >
            Entry Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="quick-entry-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today?"
            rows={8}
            disabled={isLoading}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sistah-pink focus:ring-2 focus:ring-sistah-pink/20 outline-none transition-colors resize-none text-gray-800 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            aria-label="Entry content"
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? "quick-entry-error" : "quick-entry-count"}
          />

          {/* Character Count */}
          <div className="flex items-center justify-between mt-2">
            <p
              id="quick-entry-count"
              className={`text-sm ${
                characterCount < 10
                  ? 'text-red-500'
                  : characterCount > 500
                    ? 'text-orange-500'
                    : 'text-gray-500'
              }`}
            >
              {characterCount} characters {characterCount < 10 && '(minimum 10)'}
            </p>
            {characterCount >= 10 && (
              <p className="text-sm text-green-600">Ready to save</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            id="quick-entry-error"
            className="p-4 bg-red-50 border border-red-200 rounded-xl"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel and close modal"
          >
            <div className="flex items-center space-x-2">
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </div>
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading || content.trim().length < 10}
            className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-sistah-pink to-sistah-rose hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
            aria-label="Save journal entry"
          >
            <div className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Entry'}</span>
            </div>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickEntryModal;
