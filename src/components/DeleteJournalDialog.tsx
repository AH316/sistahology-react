import React, { useState } from 'react';
import Modal from './ui/Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { Journal } from '../types';

interface DeleteJournalDialogProps {
  journal: Journal | null;
  entryCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const DeleteJournalDialog: React.FC<DeleteJournalDialogProps> = ({
  journal,
  entryCount,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting journal:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!journal) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Delete Journal
        </h3>

        {/* Warning Message */}
        <div className="mb-6 space-y-3">
          <p className="text-gray-800">
            Are you sure you want to delete{' '}
            <span className="font-semibold">"{journal.journalName}"</span>?
          </p>

          {entryCount > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">
                Warning: This journal has {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
              </p>
              <p className="text-sm text-red-700">
                All entries in this journal will be permanently deleted. This action cannot be undone.
              </p>
            </div>
          )}

          {entryCount === 0 && (
            <p className="text-sm text-gray-800">
              This action cannot be undone.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 justify-center">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-5 py-2.5 text-gray-800 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`
              px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
              focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2
              ${isDeleting
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl'
              }
              text-white
            `}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Journal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteJournalDialog;
