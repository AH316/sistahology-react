import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, RotateCcw, AlertTriangle, Loader2, Home } from 'lucide-react';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { useToast, ToastContainer } from '../components/ui/Toast';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';
import PageErrorBoundary from '../components/PageErrorBoundary';
import type { Entry } from '../types';

interface TrashedEntryWithJournal extends Entry {
  journalName?: string;
  journalColor?: string;
}

const TrashBinPage: React.FC = () => {
  const { user, isReady } = useAuth();
  const {
    journals,
    getTrashedEntries,
    recoverEntry,
    bulkRecoverEntries,
    permanentDeleteEntry,
    cleanupOldTrashedEntries
  } = useJournal();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();

  const [trashedEntries, setTrashedEntries] = useState<TrashedEntryWithJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const loadRef = useRef(false);

  // Auth readiness check
  if (!isReady) return null;

  // Load trashed entries on mount
  useEffect(() => {
    if (!user?.id || loadRef.current) return;

    const loadTrashedEntries = async () => {
      loadRef.current = true;
      setIsLoading(true);

      try {
        // Auto-cleanup expired entries (30+ days old)
        const cleanedCount = await cleanupOldTrashedEntries();
        if (cleanedCount > 0) {
          showInfo(`Automatically cleaned up ${cleanedCount} expired entries`);
        }

        // Load trashed entries
        const entries = await getTrashedEntries(user.id);

        // Enrich with journal info
        const enrichedEntries: TrashedEntryWithJournal[] = entries.map(entry => {
          const journal = journals.find(j => j.id === entry.journalId);
          return {
            ...entry,
            journalName: journal?.journalName,
            journalColor: journal?.color
          };
        });

        setTrashedEntries(enrichedEntries);
      } catch (error) {
        showError('Failed to load trashed entries');
        console.error('Error loading trashed entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrashedEntries();
  }, [user?.id, journals]);

  // Calculate days remaining before permanent deletion
  const getDaysRemaining = (deletedAt: string | null): number => {
    if (!deletedAt) return 30;

    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const daysSinceDeleted = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - daysSinceDeleted);
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
    if (selectedEntries.size === trashedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(trashedEntries.map(e => e.id)));
    }
  };

  // Recover single entry
  const handleRecover = async (entryId: string) => {
    try {
      await recoverEntry(entryId);
      setTrashedEntries(prev => prev.filter(e => e.id !== entryId));
      setSelectedEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
      showSuccess('Entry recovered successfully');
    } catch (error) {
      showError('Failed to recover entry');
      console.error('Error recovering entry:', error);
    }
  };

  // Bulk recover entries
  const handleBulkRecover = async () => {
    if (selectedEntries.size === 0) return;

    try {
      await bulkRecoverEntries(Array.from(selectedEntries));
      setTrashedEntries(prev => prev.filter(e => !selectedEntries.has(e.id)));
      setSelectedEntries(new Set());
      showSuccess(`Recovered ${selectedEntries.size} entries successfully`);
    } catch (error) {
      showError('Failed to recover entries');
      console.error('Error recovering entries:', error);
    }
  };

  // Permanent delete single entry
  const handlePermanentDelete = async (entryId: string) => {
    try {
      await permanentDeleteEntry(entryId);
      setTrashedEntries(prev => prev.filter(e => e.id !== entryId));
      setSelectedEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
      setShowDeleteConfirm(false);
      setEntryToDelete(null);
      showSuccess('Entry permanently deleted');
    } catch (error) {
      showError('Failed to delete entry');
      console.error('Error deleting entry:', error);
    }
  };

  // Bulk permanent delete
  const handleBulkDelete = async () => {
    if (selectedEntries.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedEntries).map(id => permanentDeleteEntry(id))
      );
      setTrashedEntries(prev => prev.filter(e => !selectedEntries.has(e.id)));
      setSelectedEntries(new Set());
      setShowBulkDeleteConfirm(false);
      showSuccess(`Permanently deleted ${selectedEntries.size} entries`);
    } catch (error) {
      showError('Failed to delete entries');
      console.error('Error deleting entries:', error);
    }
  };

  // Truncate content for preview
  const truncateContent = (content: string, maxLength = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Show info toast
  const showInfo = (message: string) => {
    showWarning(message); // Use warning for info messages
  };

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-gerbera-hero">
        <Navigation />
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Trash' }]} />

        <main className="max-w-7xl mx-auto px-6 py-8">

          {/* Page Header */}
          <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">Trash Bin</h1>
                  <p className="text-white/90 drop-shadow">
                    {trashedEntries.length === 0
                      ? 'No deleted entries'
                      : `${trashedEntries.length} deleted ${trashedEntries.length === 1 ? 'entry' : 'entries'}`
                    }
                  </p>
                </div>
              </div>

              {/* Bulk Actions */}
              {trashedEntries.length > 0 && (
                <div className="flex items-center space-x-3">
                  {selectedEntries.size > 0 && (
                    <>
                      <button
                        onClick={handleBulkRecover}
                        className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Recover Selected ({selectedEntries.size})</span>
                      </button>
                      <button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Permanently ({selectedEntries.size})</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="glass rounded-3xl p-12 backdrop-blur-lg border-2 border-white/40 bg-white/10 text-center">
              <Loader2 className="w-12 h-12 text-white drop-shadow-lg mx-auto mb-4 animate-spin" />
              <p className="text-white text-lg drop-shadow-lg">Loading trash bin...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && trashedEntries.length === 0 && (
            <div className="glass rounded-3xl p-12 backdrop-blur-lg border-2 border-white/40 bg-white/10 text-center">
              <Trash2 className="w-16 h-16 text-white/50 drop-shadow-lg mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white drop-shadow-lg mb-2">Trash is Empty</h2>
              <p className="text-white/90 drop-shadow mb-6">
                Deleted entries will appear here and be permanently removed after 30 days.
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          )}

          {/* Trashed Entries List */}
          {!isLoading && trashedEntries.length > 0 && (
            <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10">
              {/* Select All Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEntries.size === trashedEntries.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-white/40 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-white drop-shadow font-medium">Select All</span>
                </label>
                <span className="text-white/90 drop-shadow text-sm">
                  {selectedEntries.size} of {trashedEntries.length} selected
                </span>
              </div>

              {/* Entries */}
              <div className="space-y-4">
                {trashedEntries.map(entry => {
                  const daysRemaining = getDaysRemaining(entry.deletedAt);
                  const isUrgent = daysRemaining < 7;

                  return (
                    <div
                      key={entry.id}
                      className={`glass rounded-2xl p-4 backdrop-blur-sm border-2 ${
                        selectedEntries.has(entry.id)
                          ? 'border-pink-400 bg-pink-500/20'
                          : 'border-white/40 bg-white/10'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedEntries.has(entry.id)}
                          onChange={() => toggleEntrySelection(entry.id)}
                          className="w-5 h-5 mt-1 rounded border-white/40 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 cursor-pointer"
                        />

                        {/* Entry Content */}
                        <div className="flex-1 min-w-0">
                          {/* Journal Badge */}
                          {entry.journalName && (
                            <div className="mb-2">
                              <span
                                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white drop-shadow"
                                style={{ backgroundColor: entry.journalColor || '#F5C3E2' }}
                              >
                                {entry.journalName}
                              </span>
                            </div>
                          )}

                          {/* Content Preview */}
                          <p className="text-white drop-shadow mb-2">
                            {truncateContent(entry.content)}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center space-x-4 text-sm text-white/80 drop-shadow">
                            <span>Deleted {new Date(entry.deletedAt || '').toLocaleDateString()}</span>
                            <span className={`font-medium ${isUrgent ? 'text-red-300' : ''}`}>
                              {isUrgent && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => handleRecover(entry.id)}
                            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            title="Recover entry"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Recover</span>
                          </button>
                          <button
                            onClick={() => {
                              setEntryToDelete(entry.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warning Notice */}
          {trashedEntries.length > 0 && (
            <div className="glass rounded-2xl p-4 backdrop-blur-lg border-2 border-yellow-400/40 bg-yellow-500/10 mt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div className="text-white drop-shadow text-sm">
                  <p className="font-medium mb-1">Auto-Delete Policy</p>
                  <p className="text-white/90">
                    Entries are automatically and permanently deleted after 30 days in trash.
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && entryToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass rounded-3xl p-8 max-w-md mx-4 border-2 border-white/40 bg-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Confirm Permanent Deletion</h2>
              </div>
              <p className="text-white/90 drop-shadow mb-6">
                This entry will be permanently deleted and cannot be recovered. Are you sure you want to continue?
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setEntryToDelete(null);
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePermanentDelete(entryToDelete)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass rounded-3xl p-8 max-w-md mx-4 border-2 border-white/40 bg-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Confirm Bulk Deletion</h2>
              </div>
              <p className="text-white/90 drop-shadow mb-6">
                You are about to permanently delete {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'}.
                This action cannot be undone. Are you sure?
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Delete Permanently
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

export default TrashBinPage;
