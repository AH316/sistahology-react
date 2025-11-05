import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authStore';
import { useJournal } from '../stores/journalStore';
import { debounce } from '../utils/performance';
import type { Entry } from '../types';
import {
  Search,
  Calendar,
  BookOpen,
  Filter,
  X,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Breadcrumbs from '../components/Breadcrumbs';

type SortOption = 'relevance' | 'newest' | 'oldest' | 'longest' | 'shortest';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuth();
  const {
    loadJournals,
    searchEntries,
    journals,
    entries
  } = useJournal();

  const [query, setQuery] = useState('');
  const [selectedJournal, setSelectedJournal] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Entry[]>([]);
  const [filteredResults, setFilteredResults] = useState<Entry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter and sort state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [minWords, setMinWords] = useState<number | ''>('');
  const [maxWords, setMaxWords] = useState<number | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Debounced search function with archived support
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string, journalId?: string, includeArchivedEntries?: boolean) => {
      if (searchQuery.trim()) {
        setIsSearching(true);

        // Get base search results
        let results = searchEntries(searchQuery, journalId);

        // If includeArchived is true, also search archived entries manually
        if (includeArchivedEntries) {
          const lowercaseQuery = searchQuery.toLowerCase();
          const targetJournalId = journalId || undefined;

          // Filter archived entries matching the search
          const archivedMatches = entries.filter(entry => {
            const matchesQuery = entry.content.toLowerCase().includes(lowercaseQuery);
            const matchesJournal = !targetJournalId || entry.journalId === targetJournalId;
            return entry.isArchived && matchesQuery && matchesJournal;
          });

          // Combine results
          results = [...results, ...archivedMatches];
        }

        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300),
    [searchEntries, entries]
  );

  useEffect(() => {
    debouncedSearch(query, selectedJournal || undefined, includeArchived);
  }, [query, selectedJournal, includeArchived, debouncedSearch]);

  // Apply filters and sorting to search results
  useEffect(() => {
    let filtered = [...searchResults];

    // Apply date range filter
    if (fromDate) {
      filtered = filtered.filter(e => e.entryDate >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter(e => e.entryDate <= toDate);
    }

    // Apply word count filter
    if (minWords !== '') {
      filtered = filtered.filter(e => {
        const wordCount = e.content.trim().split(/\s+/).length;
        return wordCount >= minWords;
      });
    }
    if (maxWords !== '') {
      filtered = filtered.filter(e => {
        const wordCount = e.content.trim().split(/\s+/).length;
        return wordCount <= maxWords;
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
        break;
      case 'oldest':
        filtered.sort((a, b) => a.entryDate.localeCompare(b.entryDate));
        break;
      case 'longest':
        filtered.sort((a, b) => {
          const aWords = a.content.trim().split(/\s+/).length;
          const bWords = b.content.trim().split(/\s+/).length;
          return bWords - aWords;
        });
        break;
      case 'shortest':
        filtered.sort((a, b) => {
          const aWords = a.content.trim().split(/\s+/).length;
          const bWords = b.content.trim().split(/\s+/).length;
          return aWords - bWords;
        });
        break;
      default: // relevance - keep original order
        break;
    }

    setFilteredResults(filtered);
  }, [searchResults, fromDate, toDate, minWords, maxWords, sortBy]);

  const handleClearAllFilters = () => {
    setQuery('');
    setSelectedJournal('');
    setFromDate('');
    setToDate('');
    setSortBy('relevance');
    setIncludeArchived(false);
    setMinWords('');
    setMaxWords('');
    setSearchResults([]);
    setFilteredResults([]);
  };

  // Calculate active filter count
  const activeFilterCount = [
    fromDate,
    toDate,
    minWords !== '',
    maxWords !== '',
    includeArchived
  ].filter(Boolean).length;

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

      <main className="max-w-4xl mx-auto px-4 py-8">
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
                <Search className="h-5 w-5 text-white/90 drop-shadow-lg" />
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
                  onClick={handleClearAllFilters}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                </button>
              )}
            </div>

            {/* Main Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-white/90" />
                <span className="text-sm text-white/95 font-medium">Filters:</span>
              </div>

              <select
                value={selectedJournal}
                onChange={(e) => setSelectedJournal(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
                aria-label="Filter by journal"
              >
                <option value="">All Journals</option>
                {journals.map(journal => (
                  <option key={journal.id} value={journal.id}>
                    {journal.journalName}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
                aria-label="Sort results"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="longest">Longest</option>
                <option value="shortest">Shortest</option>
              </select>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white/90 transition-colors text-sm font-medium flex items-center space-x-2"
                aria-expanded={showAdvanced}
              >
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {activeFilterCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-sistah-pink text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters Section */}
            {showAdvanced && (
              <div className="pt-4 border-t border-white/20 space-y-4">
                {/* Include Archived Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeArchived"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="w-4 h-4 text-sistah-pink focus:ring-sistah-pink focus:ring-2 rounded border-gray-300"
                  />
                  <label htmlFor="includeArchived" className="text-sm text-white/95 cursor-pointer">
                    Include archived entries
                  </label>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fromDate" className="block text-sm text-white/95 mb-1 font-medium">
                      From Date
                    </label>
                    <input
                      type="date"
                      id="fromDate"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="toDate" className="block text-sm text-white/95 mb-1 font-medium">
                      To Date
                    </label>
                    <input
                      type="date"
                      id="toDate"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
                    />
                  </div>
                </div>

                {/* Word Count Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="minWords" className="block text-sm text-white/95 mb-1 font-medium">
                      Min Words
                    </label>
                    <input
                      type="number"
                      id="minWords"
                      value={minWords}
                      onChange={(e) => setMinWords(e.target.value === '' ? '' : parseInt(e.target.value))}
                      min="0"
                      placeholder="No minimum"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxWords" className="block text-sm text-white/95 mb-1 font-medium">
                      Max Words
                    </label>
                    <input
                      type="number"
                      id="maxWords"
                      value={maxWords}
                      onChange={(e) => setMaxWords(e.target.value === '' ? '' : parseInt(e.target.value))}
                      min="0"
                      placeholder="No maximum"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sistah-pink bg-white/70 backdrop-blur-sm text-sm"
                    />
                  </div>
                </div>

                {/* Clear All Filters Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleClearAllFilters}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {query.trim() ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Search Results
                {filteredResults.length > 0 && (
                  <span className="text-lg font-normal text-white/80 ml-2">
                    ({filteredResults.length} {filteredResults.length === 1 ? 'entry' : 'entries'} found
                    {searchResults.length !== filteredResults.length && ` • ${searchResults.length} total`})
                  </span>
                )}
              </h2>
            </div>

            {isSearching ? (
              <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-4 border-sistah-pink border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/80">Searching...</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-4">
                {filteredResults.map((entry) => {
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
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-white/90">
                              {formatDate(entry.entryDate)} • {journal?.journalName}
                            </span>
                            {entry.isArchived && (
                              <span className="px-2 py-0.5 bg-gray-500/70 text-white text-xs rounded">
                                Archived
                              </span>
                            )}
                          </div>
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
      </main>
    </div>
  );
};

export default SearchPage;