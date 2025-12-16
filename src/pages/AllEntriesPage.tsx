import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Trash2, AlertTriangle, Loader2, Home, Search, Filter, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useJournal } from '../stores/journalStore';
import { useToast, ToastContainer } from '../components/ui/Toast';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';
import PageErrorBoundary from '../components/PageErrorBoundary';
import type { Entry } from '../types';

interface EntryWithJournal extends Entry {
  journalName?: string;
  journalColor?: string;
}

type SortOption = 'date-newest' | 'date-oldest' | 'journal' | 'wordcount';

const AllEntriesPage: React.FC = () => {
  const { user, isReady } = useAuth();
  const {
    journals,
    entries,
    bulkDeleteEntries,
    updateEntry
  } = useJournal();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [searchParams] = useSearchParams();

  const [enrichedEntries, setEnrichedEntries] = useState<EntryWithJournal[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryWithJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJournalId, setFilterJournalId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [showArchived, setShowArchived] = useState(searchParams.get('archived') === 'true');
  const loadRef = useRef(false);

  // Auth readiness check
  if (!isReady) return null;

  // Load and enrich entries on mount
  useEffect(() => {
    if (!user?.id || loadRef.current) return;

    const loadEntries = async () => {
      loadRef.current = true;
      setIsLoading(true);

      try {
        // Filter only active entries (not deleted)
        const activeEntries = entries.filter(e => !e.deletedAt);

        // Enrich with journal info
        const enriched: EntryWithJournal[] = activeEntries.map(entry => {
          const journal = journals.find(j => j.id === entry.journalId);
          return {
            ...entry,
            journalName: journal?.journalName,
            journalColor: journal?.color
          };
        });

        setEnrichedEntries(enriched);
        setFilteredEntries(enriched);
      } catch (error) {
        showError('Failed to load entries');
        console.error('Error loading entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [user?.id, entries, journals]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...enrichedEntries];

    // Apply archive filter (hide archived by default)
    if (!showArchived) {
      filtered = filtered.filter(entry => !entry.isArchived);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.content.toLowerCase().includes(query)
      );
    }

    // Apply journal filter
    if (filterJournalId !== 'all') {
      filtered = filtered.filter(entry => entry.journalId === filterJournalId);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-newest':
        filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
        break;
      case 'date-oldest':
        filtered.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
        break;
      case 'journal':
        filtered.sort((a, b) => (a.journalName || '').localeCompare(b.journalName || ''));
        break;
      case 'wordcount':
        filtered.sort((a, b) => calculateWordCount(b.content) - calculateWordCount(a.content));
        break;
    }

    setFilteredEntries(filtered);
  }, [enrichedEntries, searchQuery, filterJournalId, sortBy, showArchived]);

  // Calculate word count
  const calculateWordCount = (content: string): number => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Format date display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Toggle entry selection
  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map(e => e.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEntries(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return;

    try {
      await bulkDeleteEntries(Array.from(selectedEntries));
      setSelectedEntries(new Set());
      setShowDeleteConfirm(false);
      showSuccess(`Moved ${selectedEntries.size} ${selectedEntries.size === 1 ? 'entry' : 'entries'} to trash`);
    } catch (error) {
      showError('Failed to delete entries');
      console.error('Error deleting entries:', error);
    }
  };

  // Restore entry handler
  const handleRestoreEntry = async (entryId: string) => {
    try {
      await updateEntry(entryId, { isArchived: false });
      showSuccess('Entry restored successfully!');
    } catch (error) {
      showError('Failed to restore entry');
      console.error('Error restoring entry:', error);
    }
  };

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'All Entries' }]} />

        <main className="max-w-7xl mx-auto px-6 py-8">

          {/* Page Header */}
          <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">All Entries</h1>
                  <p className="text-white/90 drop-shadow">
                    {filteredEntries.length === 0
                      ? 'No entries found'
                      : `${filteredEntries.length} ${filteredEntries.length === 1 ? 'entry' : 'entries'}`
                    }
                  </p>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedEntries.size > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={clearSelection}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected ({selectedEntries.size})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 border-2 border-white/40 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  data-testid="search-entries"
                />
              </div>

              {/* Journal Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                <select
                  value={filterJournalId}
                  onChange={(e) => setFilterJournalId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 border-2 border-white/40 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none cursor-pointer"
                  data-testid="filter-journal"
                >
                  <option value="all" className="bg-gray-800">All Journals</option>
                  {journals.map(journal => (
                    <option key={journal.id} value={journal.id} className="bg-gray-800">
                      {journal.journalName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border-2 border-white/40 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none cursor-pointer"
                data-testid="sort-entries"
              >
                <option value="date-newest" className="bg-gray-800">Newest First</option>
                <option value="date-oldest" className="bg-gray-800">Oldest First</option>
                <option value="journal" className="bg-gray-800">Journal Name</option>
                <option value="wordcount" className="bg-gray-800">Word Count</option>
              </select>
            </div>

            {/* Show Archived Toggle */}
            <div className="flex items-center space-x-2 pt-4 border-t border-white/20">
              <input
                type="checkbox"
                id="show-archived"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-white/40 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
                data-testid="show-archived-toggle"
              />
              <label htmlFor="show-archived" className="text-white drop-shadow cursor-pointer select-none">
                Show Archived Entries
              </label>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="glass rounded-3xl p-12 backdrop-blur-lg border-2 border-white/40 bg-white/10 text-center">
              <Loader2 className="w-12 h-12 text-white drop-shadow-lg mx-auto mb-4 animate-spin" />
              <p className="text-white text-lg drop-shadow-lg">Loading entries...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredEntries.length === 0 && (
            <div className="glass rounded-3xl p-12 backdrop-blur-lg border-2 border-white/40 bg-white/10 text-center">
              <FileText className="w-16 h-16 text-white/50 drop-shadow-lg mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">No Entries Found</h2>
              <p className="text-white/90 drop-shadow mb-6">
                {searchQuery || filterJournalId !== 'all'
                  ? 'Try adjusting your filters or search query.'
                  : 'Create your first journal entry to get started.'
                }
              </p>
              <Link
                to="/new-entry"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Create New Entry</span>
              </Link>
            </div>
          )}

          {/* Entries List */}
          {!isLoading && filteredEntries.length > 0 && (
            <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10">
              {/* Select All Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-white/40 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                    data-testid="select-all"
                  />
                  <span className="text-white drop-shadow font-medium">Select All</span>
                </label>
                <span className="text-white/90 drop-shadow text-sm">
                  {selectedEntries.size} of {filteredEntries.length} selected
                </span>
              </div>

              {/* Entries */}
              <div className="space-y-4">
                {filteredEntries.map(entry => (
                  <div
                    key={entry.id}
                    className={`glass rounded-2xl p-4 backdrop-blur-sm border-2 ${
                      selectedEntries.has(entry.id)
                        ? 'border-pink-400 bg-pink-500/20'
                        : entry.isArchived
                        ? 'border-yellow-400/40 bg-yellow-500/10 opacity-75'
                        : 'border-white/40 bg-white/10'
                    }`}
                    data-testid="entry-card"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id)}
                        onChange={() => toggleEntrySelection(entry.id)}
                        className="w-5 h-5 mt-1 rounded border-white/40 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                        data-testid="entry-checkbox"
                      />

                      {/* Entry Content */}
                      <div className="flex-1 min-w-0">
                        {/* Journal Badge and Date */}
                        <div className="flex items-center space-x-3 mb-2 flex-wrap">
                          {entry.journalName && (
                            <span
                              className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white drop-shadow"
                              style={{ backgroundColor: entry.journalColor || '#F5C3E2' }}
                              data-testid="journal-badge"
                            >
                              {entry.journalName}
                            </span>
                          )}
                          {entry.isArchived && (
                            <span
                              className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-500 text-white drop-shadow"
                              data-testid="archived-badge"
                            >
                              Archived
                            </span>
                          )}
                          <span className="text-white/80 drop-shadow text-sm">
                            {formatDate(entry.entryDate)}
                          </span>
                          <span className="text-white/70 drop-shadow text-sm">
                            {calculateWordCount(entry.content)} words
                          </span>
                        </div>

                        {/* Content Preview */}
                        <p className="text-white drop-shadow mb-2">
                          {truncateContent(entry.content)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        {entry.isArchived ? (
                          <button
                            onClick={() => handleRestoreEntry(entry.id)}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            data-testid="restore-button"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <Link
                            to={`/entries/${entry.id}/edit`}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            <span>View</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Notice */}
          {filteredEntries.length > 0 && (
            <div className="glass rounded-2xl p-4 backdrop-blur-lg border-2 border-blue-400/40 bg-blue-500/10 mt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <div className="text-white drop-shadow text-sm">
                  <p className="font-medium mb-1">Trash Recovery</p>
                  <p className="text-white/90">
                    Deleted entries are moved to trash and can be recovered within 30 days.
                    Visit the <Link to="/trash" className="underline hover:text-pink-300">Trash Bin</Link> to restore them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass rounded-3xl p-8 max-w-md mx-4 border-2 border-white/40 bg-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Confirm Deletion</h2>
              </div>
              <p className="text-white/90 drop-shadow mb-6">
                You are about to move {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} to trash.
                {selectedEntries.size === 1 ? 'It' : 'They'} can be recovered within 30 days. Continue?
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </PageErrorBoundary>
  );
};

export default AllEntriesPage;
