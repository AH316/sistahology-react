import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { debounce } from '../utils/performance';
import { 
  Search, 
  Calendar, 
  BookOpen, 
  Filter,
  X,
  Edit3
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const { 
    loadJournals, 
    searchEntries,
    journals
  } = useJournal();

  const [query, setQuery] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load journals when component mounts or user changes
  useEffect(() => {
    // Debug logging for auth readiness
    if (import.meta.env.VITE_DEBUG_AUTH) {
      console.debug('Search: auth state', { isReady, hasUser: !!user, userId: user?.id });
    }
    
    // Only load journals when auth is ready AND user exists
    if (isReady && user?.id) {
      if (import.meta.env.VITE_DEBUG_AUTH) {
        console.debug('Search: loading journals for user', user.id);
      }
      loadJournals(user.id);
    } else if (import.meta.env.VITE_DEBUG_AUTH) {
      console.debug('Search: skipping data fetch until auth ready');
    }
  }, [isReady, user?.id]); // Removed loadJournals from deps

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string, journalId?: string) => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const results = searchEntries(searchQuery, journalId);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300),
    [searchEntries]
  );

  useEffect(() => {
    debouncedSearch(query, selectedJournal || undefined);
  }, [query, selectedJournal, debouncedSearch]);

  const handleClearSearch = () => {
    setQuery('');
    setSelectedJournal('');
    setSearchResults([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-sistah-light text-sistah-purple px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Early return while auth is initializing - don't show data loading states
  if (!isReady) {
    return null; // ProtectedRoute will handle auth loading UI
  }

  return (
    <div className="min-h-screen bg-gerbera-hero">
      <Navigation />
      <Breadcrumbs items={[{ label: 'Search' }]} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            Search Your Entries 🔍
          </h1>
          <p className="text-white/90 drop-shadow text-lg">
            Find any entry by searching through your journal content
          </p>
        </div>

        {/* Search Form */}
        <div className="glass rounded-3xl p-6 backdrop-blur-lg border-2 border-white/40 bg-white/10 shadow-xl mb-8">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white/90" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sistah-pink focus:border-transparent bg-white/70 backdrop-blur-sm text-lg transition-all duration-200"
                placeholder="Search your journal entries..."
              />
              {query && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <X className="h-5 w-5 text-white/60 hover:text-white/80" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-white/90" />
                <span className="text-sm text-white/95">Filter by journal:</span>
              </div>
              
              <select
                value={selectedJournal}
                onChange={(e) => setSelectedJournal(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
              >
                <option value="">All Journals</option>
                {journals.map(journal => (
                  <option key={journal.id} value={journal.id}>
                    {journal.journalName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {query.trim() ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Search Results
                {searchResults.length > 0 && (
                  <span className="text-lg font-normal text-white/80 ml-2">
                    ({searchResults.length} {searchResults.length === 1 ? 'entry' : 'entries'} found)
                  </span>
                )}
              </h2>
            </div>

            {isSearching ? (
              <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-4 border-sistah-pink border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/80">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((entry) => {
                  const journal = journals.find(j => j.id === entry.journalId);
                  return (
                    <div 
                      key={entry.id} 
                      className="entry-card cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                      onClick={() => navigate(`/entries/${entry.id}/edit`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/entries/${entry.id}/edit`);
                        }
                      }}
                      aria-label={`Edit entry from ${formatDate(entry.entryDate)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: journal?.color || '#f472b6' }}
                          ></div>
                          <span className="text-sm text-white/90">
                            {formatDate(entry.entryDate)} • {journal?.journalName}
                          </span>
                        </div>
                        <Edit3 className="w-4 h-4 text-white/90 group-hover:text-white" />
                      </div>
                      
                      <div className="text-white/90 leading-relaxed line-clamp-3">
                        {highlightMatch(entry.content, query)}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-white/90">
                          {entry.content.split(' ').length} words
                        </span>
                        <span className="text-xs text-white/90">
                          Created {formatDate(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white/90" />
                </div>
                <h3 className="text-lg font-semibold text-white/80 mb-2">
                  No entries found
                </h3>
                <p className="text-white/90 max-w-sm mx-auto">
                  Try a different search term or check a different journal.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-sistah-light rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-sistah-pink" />
            </div>
            <h3 className="text-2xl font-bold text-white/90 mb-4">
              Search Your Journey
            </h3>
            <p className="text-white/80 max-w-md mx-auto mb-8 leading-relaxed">
              Enter a keyword or phrase above to search through all your journal entries. 
              Find moments, memories, and insights from your writing.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
              <Link 
                to="/dashboard" 
                className="p-4 glass rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <BookOpen className="w-6 h-6 text-sistah-pink mx-auto mb-2" />
                <span className="text-white/90 font-medium">View Dashboard</span>
              </Link>
              
              <Link 
                to="/calendar" 
                className="p-4 glass rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Calendar className="w-6 h-6 text-sistah-rose mx-auto mb-2" />
                <span className="text-white/90 font-medium">Browse Calendar</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;