import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { toastGuard, TOAST_KEYS } from '../utils/toastGuard';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';
import PageErrorBoundary from '../components/PageErrorBoundary';
import JournalCard from '../components/JournalCard';
import CreateJournalModal from '../components/CreateJournalModal';
import DeleteJournalDialog from '../components/DeleteJournalDialog';
import {
  BookOpen,
  Plus,
  Search,
  ArrowLeft,
  SortAsc,
  Sparkles
} from 'lucide-react';
import type { Journal } from '../types';

type SortOption = 'recent' | 'alphabetical' | 'entries';

const JournalsPage: React.FC = () => {
  const { user, isReady } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const {
    loadJournals,
    createJournal,
    updateJournal,
    deleteJournal,
    setCurrentJournal,
    journals,
    entries,
    currentJournal
  } = useJournal();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [deletingJournal, setDeletingJournal] = useState<Journal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isLoadingJournals, setIsLoadingJournals] = useState(true);

  // Ref to prevent duplicate loading
  const loadingRef = useRef(false);

  // Load journals on mount
  useEffect(() => {
    const loadUserJournals = async () => {
      if (isReady && user?.id) {
        if (loadingRef.current) {
          console.log('JournalsPage: load already in progress, skipping');
          return;
        }

        try {
          loadingRef.current = true;
          setIsLoadingJournals(true);

          const success = await loadJournals(user.id);

          if (!success && toastGuard.canShow(TOAST_KEYS.JOURNALS_LOAD_FAILED, 10000)) {
            showError('Failed to load journals. Please refresh the page.');
          }
        } finally {
          setIsLoadingJournals(false);
          loadingRef.current = false;
        }
      }
    };

    loadUserJournals();
  }, [isReady, user?.id]);

  // Get entry count for a journal
  const getEntryCount = (journalId: string): number => {
    return entries.filter(e => e.journalId === journalId && !e.isArchived).length;
  };

  // Get last entry date for a journal
  const getLastEntryDate = (journalId: string): string | null => {
    const journalEntries = entries
      .filter(e => e.journalId === journalId && !e.isArchived)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    return journalEntries.length > 0 ? journalEntries[0].entryDate : null;
  };

  // Filter and sort journals
  const getFilteredJournals = (): Journal[] => {
    let filtered = journals;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(j =>
        j.journalName.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case 'alphabetical':
        sorted.sort((a, b) =>
          a.journalName.localeCompare(b.journalName)
        );
        break;
      case 'entries':
        sorted.sort((a, b) =>
          getEntryCount(b.id) - getEntryCount(a.id)
        );
        break;
    }

    return sorted;
  };

  const filteredJournals = getFilteredJournals();

  // Handle create journal
  const handleCreateJournal = async (journalData: {
    journalName: string;
    color: string;
    icon?: string;
  }) => {
    if (!user?.id) return;

    try {
      const newJournal = await createJournal(user.id, journalData.journalName, journalData.color, journalData.icon);

      if (newJournal) {
        showSuccess(`Journal "${journalData.journalName}" created successfully! ✨`);
        setIsCreateModalOpen(false);
        setEditingJournal(null);
      } else {
        showError('Failed to create journal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating journal:', error);
      showError('An unexpected error occurred while creating the journal.');
    }
  };

  // Handle edit journal
  const handleEditJournal = async (journalData: {
    journalName: string;
    color: string;
    icon?: string;
  }) => {
    if (!editingJournal) return;

    try {
      const updated = await updateJournal(editingJournal.id, {
        journalName: journalData.journalName,
        color: journalData.color,
        icon: journalData.icon
      });

      if (updated) {
        showSuccess(`Journal "${journalData.journalName}" updated successfully!`);
        setIsCreateModalOpen(false);
        setEditingJournal(null);
      } else {
        showError('Failed to update journal. Please try again.');
      }
    } catch (error) {
      console.error('Error updating journal:', error);
      showError('An unexpected error occurred while updating the journal.');
    }
  };

  // Handle delete journal
  const handleDeleteJournal = async () => {
    if (!deletingJournal) return;

    try {
      await deleteJournal(deletingJournal.id);
      showSuccess(`Journal "${deletingJournal.journalName}" deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setDeletingJournal(null);
    } catch (error) {
      console.error('Error deleting journal:', error);
      showError('An unexpected error occurred while deleting the journal.');
    }
  };

  // Open edit modal
  const openEditModal = (journal: Journal) => {
    setEditingJournal(journal);
    setIsCreateModalOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (journal: Journal) => {
    setDeletingJournal(journal);
    setIsDeleteDialogOpen(true);
  };

  // Handle journal selection
  const handleSelectJournal = (journalId: string) => {
    setCurrentJournal(journalId);
    showSuccess('Journal selected!');
  };

  // Early return while auth is initializing
  if (!isReady) {
    return null;
  }

  return (
    <PageErrorBoundary pageName="Journals">
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <Breadcrumbs items={[{ label: 'Journals' }]} />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                to="/dashboard"
                className="p-3 rounded-lg bg-white/10 hover:bg-white/25 transition-all duration-200 border border-white/20 hover:border-white/40 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg flex items-center">
                  <BookOpen className="w-10 h-10 mr-3" />
                  My Journals
                </h1>
                <p className="text-white/90 drop-shadow-lg text-lg mt-1">
                  Manage and organize your journaling spaces
                </p>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="glass rounded-2xl p-4 backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white drop-shadow-lg" />
                  <input
                    type="text"
                    placeholder="Search journals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-gray-800 placeholder-gray-600"
                  />
                </div>

                {/* Sort and New Button */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <SortAsc className="w-4 h-4 text-white drop-shadow-lg" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-gray-800"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="alphabetical">Alphabetical</option>
                      <option value="entries">Most Entries</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setEditingJournal(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-sistah-pink to-sistah-rose text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>New Journal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingJournals ? (
            <div className="glass rounded-3xl p-12 text-center backdrop-blur-lg border border-white/30">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/80 drop-shadow-lg">Loading your journals...</p>
            </div>
          ) : filteredJournals.length === 0 ? (
            /* Empty State */
            journals.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-sistah-pink to-sistah-rose rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Create Your First Journal 🌸
                </h2>
                <p className="text-gray-800 mb-6 max-w-md mx-auto">
                  Start your journaling journey by creating your first journal. Give it a name, pick a color, and begin writing!
                </p>
                <button
                  onClick={() => {
                    setEditingJournal(null);
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-sistah-pink to-sistah-rose text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 inline-flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Journal</span>
                </button>
              </div>
            ) : (
              /* No search results */
              <div className="glass rounded-3xl p-12 text-center backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl">
                <Search className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  No journals found
                </h2>
                <p className="text-gray-800">
                  Try adjusting your search query
                </p>
              </div>
            )
          ) : (
            /* Journal Grid */
            <>
              <div className="mb-4 text-white/90 drop-shadow-lg">
                Showing {filteredJournals.length} {filteredJournals.length === 1 ? 'journal' : 'journals'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJournals.map((journal) => (
                  <JournalCard
                    key={journal.id}
                    journal={journal}
                    entryCount={getEntryCount(journal.id)}
                    lastEntryDate={getLastEntryDate(journal.id)}
                    onEdit={openEditModal}
                    onDelete={openDeleteDialog}
                    onSelect={handleSelectJournal}
                    isSelected={currentJournal?.id === journal.id}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Create/Edit Journal Modal */}
        <CreateJournalModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingJournal(null);
          }}
          onSuccess={editingJournal ? handleEditJournal : handleCreateJournal}
          editMode={!!editingJournal}
          initialData={
            editingJournal
              ? {
                  journalName: editingJournal.journalName,
                  color: editingJournal.color,
                  icon: editingJournal.icon
                }
              : undefined
          }
        />

        {/* Delete Journal Dialog */}
        <DeleteJournalDialog
          journal={deletingJournal}
          entryCount={deletingJournal ? getEntryCount(deletingJournal.id) : 0}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeletingJournal(null);
          }}
          onConfirm={handleDeleteJournal}
        />

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </PageErrorBoundary>
  );
};

export default JournalsPage;
