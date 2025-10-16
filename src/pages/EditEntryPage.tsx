import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { 
  ArrowLeft, 
  Save, 
  Trash2,
  Calendar as CalendarIcon,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import Navigation from '../components/Navigation';
import PageErrorBoundary from '../components/PageErrorBoundary';
import { useToast, ToastContainer } from '../components/ui/Toast';

// Timezone-safe date formatting utility
function toYYYYMMDD(d: string | Date): string {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EditEntryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { 
    getEntry,
    updateEntry,
    deleteEntry,
    journals, 
    setCurrentJournal,
    error,
    clearError
  } = useJournal();

  const [, setEntry] = useState<any>(null);
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedJournalId, setSelectedJournalId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const redirectHandledRef = useRef(false);
  const entryCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const entryLoadedRef = useRef(false);

  // Safe redirect function to prevent multiple redirects
  const safeRedirect = (message: string, delay = 800) => {
    if (redirectHandledRef.current) return;
    redirectHandledRef.current = true;
    
    // Clear any interval checks
    if (entryCheckIntervalRef.current) {
      clearInterval(entryCheckIntervalRef.current);
      entryCheckIntervalRef.current = null;
    }
    
    showError(message);
    setTimeout(() => {
      // Try to go to parent journal's entries, fallback to dashboard
      const parentJournal = journals.find(j => j.id === selectedJournalId);
      if (parentJournal) {
        navigate('/calendar');
      } else {
        navigate('/dashboard');
      }
    }, delay);
  };

  // Load entry on mount (only once)
  useEffect(() => {
    // Only load entry once on initial mount
    if (entryLoadedRef.current || !id) {
      if (!id && !redirectHandledRef.current) {
        safeRedirect('Entry ID not found');
      }
      return;
    }

    const foundEntry = getEntry(id);
    if (foundEntry) {
      entryLoadedRef.current = true;
      setEntry(foundEntry);
      setContent(foundEntry.content);
      setSelectedDate(foundEntry.entryDate);
      setSelectedJournalId(foundEntry.journalId);
      setIsLoading(false);

      // Set up periodic check to detect if entry was deleted elsewhere
      entryCheckIntervalRef.current = setInterval(() => {
        const stillExists = getEntry(id);
        if (!stillExists && !redirectHandledRef.current) {
          safeRedirect('Entry was deleted or not found', 1000);
        }
      }, 5000); // Check every 5 seconds
    } else if (!redirectHandledRef.current) {
      safeRedirect('Entry was deleted or not found');
    }
  }, [id]); // Only re-run if entry ID changes
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (entryCheckIntervalRef.current) {
        clearInterval(entryCheckIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update word count
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [content, selectedDate, clearError]);

  const handleJournalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const journalId = e.target.value;
    setSelectedJournalId(journalId);
    setCurrentJournal(journalId);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showError('Entry content cannot be empty');
      return;
    }

    if (!selectedJournalId) {
      showError('Please select a journal');
      return;
    }

    // Validate date is not in the future
    const today = toYYYYMMDD(new Date());
    if (selectedDate > today) {
      showError('Cannot create entries for future dates');
      return;
    }

    setIsSaving(true);
    
    try {
      const updatedEntry = await updateEntry(id!, {
        content: content.trim(),
        entryDate: selectedDate,
        journalId: selectedJournalId
      });

      if (updatedEntry) {
        showSuccess('Entry updated successfully!');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        showError('Failed to update entry');
      }
    } catch (error) {
      console.error('Update entry error:', error);
      showError('An error occurred while updating the entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (redirectHandledRef.current) return; // Prevent multiple delete attempts
    
    setIsDeleting(true);
    setShowDeleteConfirm(false); // Close modal immediately
    
    try {
      // Clear any interval checks
      if (entryCheckIntervalRef.current) {
        clearInterval(entryCheckIntervalRef.current);
        entryCheckIntervalRef.current = null;
      }
      
      await deleteEntry(id!);
      redirectHandledRef.current = true;
      showSuccess('Entry deleted successfully!');
      
      // Navigate immediately, no delay
      const parentJournal = journals.find(j => j.id === selectedJournalId);
      if (parentJournal) {
        navigate('/calendar');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Delete entry error:', error);
      showError('An error occurred while deleting the entry');
      setIsDeleting(false);
    }
  };

  // Early return while auth is initializing - don't show data loading states
  if (!isReady) {
    return null; // ProtectedRoute will handle auth loading UI
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gerbera-hero flex items-center justify-center">
        <div className="glass rounded-3xl p-8 text-center backdrop-blur-lg border border-white/30">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80 drop-shadow-lg">Loading entry...</p>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="Edit Entry">
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                Edit Entry
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || redirectHandledRef.current}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                aria-label="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !content.trim() || !selectedJournalId}
                className={`
                  px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2
                  ${isSaving || !content.trim() || !selectedJournalId
                    ? 'bg-white/20 text-white/60 cursor-not-allowed' 
                    : 'btn-primary hover:shadow-xl transform hover:-translate-y-0.5'
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
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Entry Form */}
          <div className="space-y-6">
            {/* Date and Journal Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Date Picker */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                  Entry Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={toYYYYMMDD(new Date())}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Journal Selector */}
              <div>
                <label htmlFor="journal" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                  Journal
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-800" />
                  <select
                    id="journal"
                    value={selectedJournalId}
                    onChange={handleJournalChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/80 backdrop-blur-sm appearance-none"
                  >
                    <option value="">Select a journal...</option>
                    {journals.map((journal) => (
                      <option key={journal.id} value={journal.id}>
                        {journal.journalName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-white drop-shadow-lg">
                  Your Entry
                </label>
                <span className="text-sm text-white/80 drop-shadow-lg">
                  {wordCount} words
                </span>
              </div>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind today?"
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/80 backdrop-blur-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Entry
                </h3>
              </div>
              
              <p className="text-gray-800 mb-6">
                Are you sure you want to delete this entry? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-800 hover:text-gray-900 disabled:text-gray-400 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-lg"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || redirectHandledRef.current}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                  aria-label="Confirm delete entry"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Entry'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageErrorBoundary>
  );
};

export default EditEntryPage;