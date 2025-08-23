import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { formatDate } from '../utils/performance';
import Navigation from '../components/Navigation';
import PageErrorBoundary from '../components/PageErrorBoundary';
import InlineError from '../components/InlineError';
import { 
  BookOpen, 
  Calendar, 
  Search, 
  Plus, 
  Archive, 
  Flame, 
  BarChart3,
  Clock,
  Edit3
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    loadJournals, 
    getDashboardStats, 
    currentJournal, 
    isLoading, 
    error 
  } = useJournal();

  useEffect(() => {
    // Load journals only once when user is available
    if (user && user.id && !isLoading) {
      loadJournals(user.id);
    }
  }, [user?.id]); // Only depend on user.id

  const stats = getDashboardStats();

  if (isLoading) {
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

  return (
    <PageErrorBoundary pageName="Dashboard">
      <div className="min-h-screen bg-gerbera-hero">
        {/* Shared Navigation */}
        <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                <BarChart3 className="w-5 h-5 text-white/60" />
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

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl flex items-center justify-center">
                  <Archive className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.archivedEntries}
              </div>
              <p className="text-white/80 text-sm">Archived</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Entries */}
          <div className="lg:col-span-2">
            <div className="glass rounded-3xl p-8 backdrop-blur-lg border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Recent Entries</h2>
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
                        <span className="text-sm text-white/70">
                          {formatDate(entry.entryDate)}
                        </span>
                      </div>
                      <Edit3 className="w-4 h-4 text-white/60" />
                    </div>
                    
                    <p className="text-white leading-relaxed line-clamp-3">
                      {entry.content}
                    </p>
                    
                    <div className="mt-4 pt-3 border-t border-white/20">
                      <span className="text-xs text-white/80">
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
                  <h3 className="text-lg font-semibold text-white drop-shadow-lg mb-2">
                    No entries yet
                  </h3>
                  <p className="text-white/80 drop-shadow-lg mb-4 max-w-sm mx-auto">
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
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            
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
                className="block p-6 glass rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/15"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-sistah-rose to-sistah-purple rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Calendar</h3>
                    <p className="text-white/80 text-sm">View your progress</p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/search" 
                className="block p-6 glass rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 bg-white/10 backdrop-blur-lg border-2 border-white/30 hover:border-white/50 hover:bg-white/15"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-sistah-purple to-sistah-pink rounded-xl flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Search</h3>
                    <p className="text-white/80 text-sm">Find past entries</p>
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
                    <h3 className="font-semibold text-white">Current Journal</h3>
                  </div>
                  <p className="text-white/90 font-medium">
                    {currentJournal.journalName}
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    Created {formatDate(currentJournal.createdAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </PageErrorBoundary>
  );
};

export default DashboardPage;