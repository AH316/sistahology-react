import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJournal } from '../stores/journalStore';
import { useToast, ToastContainer } from '../components/ui/Toast';
import { formatDate } from '../utils/performance';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';
import PageErrorBoundary from '../components/PageErrorBoundary';
import InlineError from '../components/InlineError';
import { toastGuard, TOAST_KEYS } from '../utils/toastGuard';
import WeeklyActivityWidget from '../components/dashboard/WeeklyActivityWidget';
import JournalDistributionWidget from '../components/dashboard/JournalDistributionWidget';
import StreakCalendarWidget from '../components/dashboard/StreakCalendarWidget';
import {
  BookOpen,
  Calendar,
  Search,
  Plus,
  Archive,
  Flame,
  BarChart3,
  Clock,
  Edit3,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const {
    loadJournals,
    getDashboardStats,
    deleteEntry,
    currentJournal,
    journals,
    entries,
    isLoading,
    error
  } = useJournal();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Track browser tab visibility events
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('[TAB-SWITCH-DEBUG] visibilitychange event', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    };

    const handleFocus = () => {
      console.log('[TAB-SWITCH-DEBUG] window focus event', {
        timestamp: new Date().toISOString()
      });
    };

    const handleBlur = () => {
      console.log('[TAB-SWITCH-DEBUG] window blur event', {
        timestamp: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useEffect(() => {
    console.log('[TAB-SWITCH-DEBUG] Dashboard useEffect triggered', {
      isReady,
      hasUser: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    const loadUserJournals = async () => {
      // Debug logging for auth readiness
      if (import.meta.env.VITE_DEBUG_AUTH) {
        console.debug('Dashboard: auth state', { isReady, hasUser: !!user, userId: user?.id });
      }

      // Only load journals when auth is ready AND user exists
      if (isReady && user?.id) {
        console.log('[TAB-SWITCH-DEBUG] Dashboard: Starting journal load for user', user.id);
        try {
          if (import.meta.env.VITE_DEBUG_AUTH) {
            console.debug('Dashboard: loading journals for user', user.id);
          }

          // loadJournals now handles errors internally and returns success boolean
          const success = await loadJournals(user.id);

          console.log('[TAB-SWITCH-DEBUG] Dashboard: Journal load completed', {
            success,
            userId: user.id,
            timestamp: new Date().toISOString()
          });

          // Only show error toast if it hasn't been shown recently (global de-duplication)
          if (!success && toastGuard.canShow(TOAST_KEYS.JOURNALS_LOAD_FAILED, 10000)) {
            console.warn('[DEBUG] Dashboard: Showing journal load error toast', { success, userId: user.id });
            showError('Failed to load journals. Please refresh the page.');
          } else if (!success) {
            console.warn('[DEBUG] Dashboard: Journal load failed but toast blocked by guard', { success, userId: user.id });
          }
        } catch (error) {
          console.error('[TAB-SWITCH-DEBUG] Dashboard: Error loading journals', error);
          console.error('Dashboard: error loading journals', error);
        }
      } else {
        console.log('[TAB-SWITCH-DEBUG] Dashboard: Skipping data fetch', {
          isReady,
          hasUser: !!user?.id,
          reason: !isReady ? 'auth not ready' : 'no user ID'
        });
        if (import.meta.env.VITE_DEBUG_AUTH) {
          console.debug('Dashboard: skipping data fetch until auth ready');
        }
      }
    };

    loadUserJournals();
  }, [isReady, user?.id]); // Removed loadJournals from deps

  const stats = getDashboardStats();

  // Early return while auth is initializing - don't show data loading states
  if (!isReady) {
    console.log('[TAB-SWITCH-DEBUG] Dashboard render: Auth not ready, returning null');
    return null; // ProtectedRoute will handle auth loading UI
  }

  // Now show data loading state only after auth is ready
  if (isLoading) {
    console.log('[TAB-SWITCH-DEBUG] Dashboard render: isLoading=true, showing "Loading your dashboard..."', {
      isReady,
      isAuthenticated: user !== null,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    return (
      <div className="min-h-screen bg-gerbera-hero flex items-center justify-center">
        <div className="glass rounded-3xl p-8 text-center backdrop-blur-lg border border-white/30">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80 drop-shadow-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Remove the full-screen error handling - let Error Boundaries handle critical errors
  // For non-critical errors, show inline error in the UI

  const formatDateSafe = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return formatDate(dateString);
  };
  
  // Handle entry deletion with optimistic UI update
  const handleDeleteEntry = async (entryId: string) => {
    if (!entryId || isDeleting) return;
    
    setIsDeleting(entryId);
    
    try {
      await deleteEntry(entryId);
      showSuccess('Entry deleted successfully!');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Delete entry error:', error);
      showError('An error occurred while deleting the entry');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <PageErrorBoundary pageName="Dashboard">
      <div className="min-h-screen bg-gerbera-hero">
        {/* Shared Navigation */}
        <Navigation />
        <Breadcrumbs items={[{ label: 'Dashboard' }]} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            Welcome back, {user?.name?.split(' ')[0]}! ✨
          </h1>
          <p className="text-white/90 drop-shadow-lg text-lg">
            {currentJournal ? `Continue your journey in "${currentJournal.journalName}"` : 'Ready to start writing?'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <InlineError 
              error={error} 
              onRetry={() => user?.id && loadJournals(user.id)}
            />
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-sistah-pink to-sistah-rose rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <BarChart3 className="w-5 h-5 text-white/90" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalEntries}
              </div>
              <p className="text-white/80 text-sm">Total Entries</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-sistah-rose to-sistah-purple rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-orange-500 text-sm font-medium">🔥</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.writingStreak}
              </div>
              <p className="text-white/80 text-sm">Day Streak</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-sistah-purple to-sistah-pink rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {formatDateSafe(stats.lastEntryDate)}
              </div>
              <p className="text-white/80 text-sm">Last Entry</p>
            </div>

            <Link
              to="/journals?archived=true"
              className="stat-card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <Archive className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.archivedEntries}
              </div>
              <p className="text-white/80 text-sm">
                Archived {stats.archivedEntries > 0 && '(Click to view)'}
              </p>
            </Link>
          </div>
        )}

        {/* Stats Widgets */}
        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <WeeklyActivityWidget stats={stats} />
            <JournalDistributionWidget journals={journals} entries={entries} />
            <StreakCalendarWidget stats={stats} />
          </div>
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Entries */}
          <div className="lg:col-span-2">
            <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Recent Entries</h2>
                <Link 
                  to="/calendar" 
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/40 shadow-lg"
                >
                  View All
                  <Calendar className="w-4 h-4" />
                </Link>
              </div>

            <div className="space-y-4">
              {stats?.recentEntries && stats.recentEntries.length > 0 ? (
                stats.recentEntries.map((entry) => (
                  <div key={entry.id} className="entry-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-sistah-pink to-sistah-rose"></div>
                        <span className="text-sm text-gray-800">
                          {formatDate(entry.entryDate)}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/entries/${entry.id}/edit`)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
                        aria-label="Edit entry"
                        title="Edit this entry"
                      >
                        <Edit3 className="w-4 h-4 text-gray-800 hover:text-gray-900" />
                      </button>
                    </div>
                    
                    <p className="text-gray-800 leading-relaxed line-clamp-3">
                      {entry.content}
                    </p>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-800">
                        {entry.content.split(' ').length} words
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-sistah-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-8 h-8 text-sistah-pink" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    No entries yet
                  </h3>
                  <p className="text-gray-800 mb-4 max-w-sm mx-auto">
                    Start your journaling journey by creating your first entry.
                  </p>
                  <Link 
                    to="/new-entry" 
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Entry
                  </Link>
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Link 
                to="/new-entry" 
                className="block p-6 bg-gradient-to-r from-sistah-pink to-sistah-rose rounded-2xl text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">New Entry</h3>
                    <p className="text-white/80 text-sm">Start writing today</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/calendar"
                className="block p-6 glass rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-sistah-rose to-sistah-purple rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white drop-shadow-lg">Calendar</h3>
                    <p className="text-white drop-shadow-lg text-sm">View your progress</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/search"
                className="block p-6 glass rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-sistah-purple to-sistah-pink rounded-xl flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white drop-shadow-lg">Search</h3>
                    <p className="text-white drop-shadow-lg text-sm">Find past entries</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/journals"
                className="block p-6 glass rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-sistah-rose rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white drop-shadow-lg">Manage Journals</h3>
                    <p className="text-white drop-shadow-lg text-sm">{journals.length} {journals.length === 1 ? 'journal' : 'journals'}</p>
                  </div>
                </div>
              </Link>

              {/* Current Journal Info */}
              {currentJournal && (
                <div className="p-6 glass rounded-2xl bg-white/15 backdrop-blur-lg border-2 border-white/40 shadow-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: currentJournal.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-800">Current Journal</h3>
                  </div>
                  <p className="text-gray-800 font-medium">
                    {currentJournal.journalName}
                  </p>
                  <p className="text-gray-800 text-sm mt-1">
                    Created {formatDate(currentJournal.createdAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        </main>
        
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
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting === showDeleteConfirm}
                  className="px-4 py-2 text-gray-800 hover:text-gray-900 disabled:text-gray-400 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 rounded-lg"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEntry(showDeleteConfirm)}
                  disabled={isDeleting === showDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                  aria-label="Confirm delete entry"
                >
                  {isDeleting === showDeleteConfirm ? 'Deleting...' : 'Delete Entry'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageErrorBoundary>
  );
};

export default DashboardPage;