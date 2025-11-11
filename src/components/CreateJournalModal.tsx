import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import ColorPicker from './ColorPicker';
import IconPicker from './IconPicker';
import { BookOpen, Sparkles } from 'lucide-react';

interface CreateJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (journalData: { journalName: string; color: string; icon?: string }) => Promise<void>;
  editMode?: boolean;
  initialData?: {
    journalName: string;
    color: string;
    icon?: string;
  };
}

const CreateJournalModal: React.FC<CreateJournalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editMode = false,
  initialData
}) => {
  const [journalName, setJournalName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF69B4');
  const [selectedIcon, setSelectedIcon] = useState('📔');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens/closes or edit mode changes
  useEffect(() => {
    if (isOpen) {
      if (editMode && initialData) {
        setJournalName(initialData.journalName);
        setSelectedColor(initialData.color);
        setSelectedIcon(initialData.icon || '📔');
      } else {
        setJournalName('');
        setSelectedColor('#FF69B4');
        setSelectedIcon('📔');
      }
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, editMode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate journal name
    const trimmedName = journalName.trim();
    if (!trimmedName) {
      setError('Journal name is required');
      return;
    }

    if (trimmedName.length < 1 || trimmedName.length > 50) {
      setError('Journal name must be between 1 and 50 characters');
      return;
    }

    setIsSaving(true);

    try {
      await onSuccess({
        journalName: trimmedName,
        color: selectedColor,
        icon: selectedIcon
      });

      // Close modal on success
      onClose();
    } catch (err) {
      console.error('Error saving journal:', err);
      setError(err instanceof Error ? err.message : 'Failed to save journal');
    } finally {
      setIsSaving(false);
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
      title={editMode ? 'Edit Journal' : 'Create New Journal'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Journal Name Input */}
        <div>
          <label htmlFor="journal-name" className="block text-sm font-medium text-gray-800 mb-2">
            Journal Name <span className="text-red-500">*</span>
          </label>
          <input
            id="journal-name"
            type="text"
            value={journalName}
            onChange={(e) => setJournalName(e.target.value)}
            placeholder="e.g., My Daily Journal, Gratitude Journal, Dream Log"
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-500"
            autoFocus
            disabled={isSaving}
          />
          <p className="text-xs text-gray-800 mt-1">
            {journalName.length}/50 characters
          </p>
        </div>

        {/* Color Picker */}
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
        />

        {/* Icon Picker */}
        <IconPicker
          selectedIcon={selectedIcon}
          onIconChange={setSelectedIcon}
        />

        {/* Live Preview Card */}
        <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-800 mb-3 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Preview
          </p>
          <div className="glass rounded-lg p-4 border-2 border-white/40 bg-white/15">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedIcon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">
                  {journalName.trim() || 'Journal Name'}
                </h3>
                <p className="text-sm text-gray-800">
                  0 entries
                </p>
              </div>
            </div>
          </div>
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
            disabled={isSaving || !journalName.trim()}
            className={`
              px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
              focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
              ${isSaving || !journalName.trim()
                ? 'bg-gray-400/60 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-sistah-pink to-sistah-rose text-white hover:shadow-lg transform hover:-translate-y-0.5'
              }
            `}
          >
            {isSaving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>{editMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                <span>{editMode ? 'Update Journal' : 'Create Journal'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateJournalModal;
