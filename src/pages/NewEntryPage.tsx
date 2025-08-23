import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { 
  ArrowLeft, 
  Save, 
  BookOpen, 
  Calendar as CalendarIcon,
  Palette,
  Heart
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

const NewEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { 
    loadJournals, 
    createJournalEntry,
    createJournal, 
    journals, 
    setCurrentJournal,
    error,
    clearError
  } = useJournal();

  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || toYYYYMMDD(new Date())
  );
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Load journals when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      loadJournals(user.id);
    }
  }, [user?.id]); // Only depend on user.id, not the loadJournals function

  // Log when journals finish loading - TODO: remove after testing
  useEffect(() => {
    console.log('[JournalSelect] loaded', journals);
  }, [journals]);

  // Async default selection - set first journal when loaded
  useEffect(() => {
    if (!selectedJournalId && journals.length > 0) {
      const firstJournalId = String(journals[0].id); // Ensure string UUID
      console.log('[JournalSelect] Setting default journal:', firstJournalId);
      setSelectedJournalId(firstJournalId);
      setCurrentJournal(firstJournalId);
    }
  }, [journals, selectedJournalId, setCurrentJournal]);

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
    console.log('[JournalSelect] onChange value:', journalId, 'typeof:', typeof journalId);
    console.log('[JournalSelect] DOM event target:', e.target);
    setSelectedJournalId(journalId);
    setCurrentJournal(journalId);
  };

  const handleCreateJournal = async () => {
    if (!user?.id) return;
    
    const journalName = prompt('Enter journal name:');
    if (!journalName?.trim()) return;
    
    const newJournal = await createJournal(user.id, journalName.trim());
    if (newJournal) {
      setSelectedJournalId(newJournal.id);
      setCurrentJournal(newJournal.id);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showError('Please enter some content before saving.');
      return;
    }

    if (!selectedJournalId || !user?.id) {
      showError('Please select a journal and ensure you are logged in.');
      return;
    }

    setIsSaving(true);
    
    try {
      const result = await createJournalEntry({
        userId: user.id,
        journalId: selectedJournalId,
        entryDate: selectedDate,
        content: content.trim()
      });

      if (result?.id) {
        showSuccess('Entry saved successfully!');
        
        // Clear form and navigate immediately
        setContent('');
        setSelectedDate(toYYYYMMDD(new Date()));
        navigate('/dashboard');
      } else {
        showError('Failed to save entry. Please try again.');
      }
    } catch (err) {
      console.error('Error creating entry:', err);
      showError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const today = toYYYYMMDD(new Date());
  const isFutureDate = new Date(selectedDate) > new Date(today);
  const canSave = !!selectedJournalId && !!selectedDate && !!content.trim();
  
  // Log current selectedJournalId before render - TODO: remove after testing
  console.log('[JournalSelect] Pre-render selectedJournalId:', selectedJournalId);


  return (
    <PageErrorBoundary pageName="New Entry">
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
      
      {/* Sub-header for New Entry */}
      <div className="bg-white/20 backdrop-blur-lg border-b-2 border-white/30 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="p-3 rounded-lg bg-white/10 hover:bg-white/25 transition-all duration-200 border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white drop-shadow-lg">New Entry</h1>
                <p className="text-sm text-white/80 drop-shadow">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-white/70">
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </div>
              <button
                onClick={handleSave}
                disabled={!canSave || isSaving || isFutureDate}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                  ${!canSave || isSaving || isFutureDate
                    ? 'bg-white/20 text-white/60 cursor-not-allowed'
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
                    <Save className="w-4 h-4" />
                    <span>Save Entry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Entry Controls */}
        <div className="glass rounded-2xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Journal Selection */}
            <div>
              <label htmlFor="journal" className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Journal
              </label>
              {journals.length === 0 ? (
                <div className="space-y-2">
                  <select
                    id="journal"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value="">No journals yet</option>
                  </select>
                  <button
                    onClick={handleCreateJournal}
                    className="text-sm text-sistah-pink hover:text-pink-600 underline"
                  >
                    Create your first journal
                  </button>
                </div>
              ) : (
                <>
                  <select
                    id="journal"
                    value={selectedJournalId ?? ''}
                    onChange={handleJournalChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm pointer-events-auto relative z-10"
                  >
                    {!selectedJournalId && (
                      <option value="" disabled>Select a journal…</option>
                    )}
                    {journals.map(journal => (
                      <option key={journal.id} value={String(journal.id)}>
                        {journal.journalName}
                      </option>
                    ))}
                  </select>
                  {selectedJournalId && (
                    <div className="flex items-center mt-2">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ 
                          backgroundColor: journals.find(j => j.id === selectedJournalId)?.color || '#f472b6' 
                        }}
                      ></div>
                      <span className="text-sm text-white/80">
                        {journals.find(j => j.id === selectedJournalId)?.journalName}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-white drop-shadow-lg mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-2" />
                Entry Date
              </label>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm"
              />
              {isFutureDate && (
                <p className="text-red-400 text-sm mt-2 drop-shadow">
                  You can't save entries dated in the future.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Writing Area */}
        <div className="glass rounded-2xl backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-sistah-pink" fill="currentColor" />
              <h2 className="text-lg font-semibold text-white drop-shadow-lg">
                What's on your mind today?
              </h2>
            </div>
            <p className="text-white/80 drop-shadow text-sm mt-1">
              Let your thoughts flow freely. This is your safe space.
            </p>
          </div>
          
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Start writing... Your thoughts, feelings, dreams, or anything that comes to mind. This is your private space to reflect and grow."
              className="w-full min-h-[400px] p-6 bg-transparent resize-none focus:outline-none text-gray-800 leading-relaxed placeholder-white/60"
              autoFocus
            />
            
            {/* Writing Tips */}
            {!content && (
              <div className="absolute bottom-6 right-6 max-w-xs">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-pink-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Palette className="w-4 h-4 mr-2 text-sistah-pink" />
                    Writing Tips
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Write freely without judgment</li>
                    <li>• Focus on how you feel</li>
                    <li>• Use ⌘+S to save quickly</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/80 drop-shadow text-sm">
            Your entries are private and stored securely on your device only
          </p>
        </div>
      </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </PageErrorBoundary>
  );
};

export default NewEntryPage;