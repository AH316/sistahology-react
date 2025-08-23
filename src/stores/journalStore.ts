import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseDatabase } from '../lib/supabase-database';
// Removed unused convertSupabaseToReact import
import type { Journal, Entry, JournalState, DashboardStats } from '../types';

interface JournalStore extends JournalState {
  // Actions
  loadJournals: (userId: string) => Promise<void>;
  loadEntries: (userId: string) => Promise<void>;
  createJournal: (userId: string, journalName: string, color?: string) => Promise<Journal | null>;
  updateJournal: (journalId: string, updates: Partial<Journal>) => Promise<Journal | null>;
  deleteJournal: (journalId: string) => Promise<void>;
  setCurrentJournal: (journalId: string) => boolean;
  createEntry: (userId: string, content: string, entryDate?: string, journalId?: string) => Promise<Entry | null>;
  createJournalEntry: (params: { userId: string; journalId: string; entryDate: string; title?: string; content: string }) => Promise<{ id: string } | null>;
  updateEntry: (entryId: string, updates: Partial<Entry>) => Promise<Entry | null>;
  archiveEntry: (entryId: string) => Promise<Entry | null>;
  deleteEntry: (entryId: string) => Promise<void>;
  getEntries: (journalId?: string, includeArchived?: boolean) => Entry[];
  getEntry: (entryId: string) => Entry | undefined;
  searchEntries: (query: string, journalId?: string) => Entry[];
  getDashboardStats: () => DashboardStats | null;
  calculateWritingStreak: () => number;
  exportJournal: (journalId?: string, format?: 'text') => string | null;
  clearError: () => void;
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
  // Initial state
  journals: [],
  currentJournal: null,
  entries: [],
  isLoading: false,
  error: null,

  // Actions
  loadJournals: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await supabaseDatabase.journals.getAll(userId);
      
      if (response.success && response.data) {
        const journals = response.data;
        
        // Set current journal to first one if exists
        const currentJournal = journals.length > 0 ? journals[0] : null;

        set({ 
          journals, 
          currentJournal,
          isLoading: false 
        });

        // Load entries after journals are loaded
        get().loadEntries(userId);
      } else {
        throw new Error(response.error || 'Failed to load journals');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load journals';
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadEntries: async (userId: string) => {
    try {
      const response = await supabaseDatabase.entries.getAllForUser(userId, true); // Include archived
      
      if (response.success && response.data) {
        set({ entries: response.data });
      } else {
        console.error('Error loading entries:', response.error);
        set({ entries: [] });
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      set({ entries: [] });
    }
  },

  createJournal: async (userId: string, journalName: string, color = '#F5C3E2') => {
    try {
      const response = await supabaseDatabase.journals.create(userId, journalName, color);
      
      if (response.success && response.data) {
        const { journals } = get();
        const updatedJournals = [...journals, response.data];
        
        set({ 
          journals: updatedJournals,
          currentJournal: journals.length === 0 ? response.data : get().currentJournal
        });

        return response.data;
      } else {
        set({ error: response.error || 'Failed to create journal' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal';
      set({ error: errorMessage });
      return null;
    }
  },

  updateJournal: async (journalId: string, updates: Partial<Journal>) => {
    try {
      const response = await supabaseDatabase.journals.update(journalId, updates);
      
      if (response.success && response.data) {
        const { journals } = get();
        const journalIndex = journals.findIndex(j => j.id === journalId);
        
        if (journalIndex !== -1) {
          const updatedJournals = [...journals];
          updatedJournals[journalIndex] = response.data;

          set({ 
            journals: updatedJournals,
            currentJournal: get().currentJournal?.id === journalId ? response.data : get().currentJournal
          });
        }

        return response.data;
      } else {
        set({ error: response.error || 'Failed to update journal' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update journal';
      set({ error: errorMessage });
      return null;
    }
  },

  deleteJournal: async (journalId: string) => {
    try {
      const { journals, entries, currentJournal } = get();
      
      // Don't allow deleting the last journal
      if (journals.length <= 1) {
        set({ error: 'Cannot delete your only journal' });
        return;
      }

      const response = await supabaseDatabase.journals.delete(journalId);
      
      if (response.success) {
        // Remove journal and its entries from local state
        const updatedJournals = journals.filter(j => j.id !== journalId);
        const updatedEntries = entries.filter(e => e.journalId !== journalId);

        // Update current journal if necessary
        const newCurrentJournal = currentJournal?.id === journalId ? updatedJournals[0] : currentJournal;

        set({ 
          journals: updatedJournals,
          entries: updatedEntries,
          currentJournal: newCurrentJournal
        });
      } else {
        set({ error: response.error || 'Failed to delete journal' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete journal';
      set({ error: errorMessage });
    }
  },

  setCurrentJournal: (journalId: string) => {
    const { journals } = get();
    const journal = journals.find(j => j.id === journalId);
    
    if (journal) {
      set({ currentJournal: journal });
      return true;
    }
    return false;
  },

  createEntry: async (userId: string, content: string, entryDate?: string, journalId?: string) => {
    try {
      const { currentJournal, entries } = get();
      const targetJournalId = journalId || currentJournal?.id;
      
      if (!targetJournalId) {
        set({ error: 'No journal selected' });
        return null;
      }

      const response = await supabaseDatabase.entries.create(userId, targetJournalId, content, entryDate);
      
      if (response.success && response.data) {
        const updatedEntries = [...entries, response.data];
        set({ entries: updatedEntries });
        return response.data;
      } else {
        set({ error: response.error || 'Failed to create entry' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create entry';
      set({ error: errorMessage });
      return null;
    }
  },

  createJournalEntry: async (params: { userId: string; journalId: string; entryDate: string; title?: string; content: string }) => {
    try {
      const { userId, journalId, entryDate, content, title } = params;
      
      if (!content.trim()) {
        set({ error: 'Entry content cannot be empty' });
        return null;
      }

      if (!journalId) {
        set({ error: 'No journal selected' });
        return null;
      }

      // Timezone-safe date formatting function
      function toYYYYMMDD(d: string | Date): string {
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        const dt = new Date(d);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }

      // Format dates properly
      const fd = toYYYYMMDD(entryDate);
      const today = toYYYYMMDD(new Date());
      
      // Validate date is not in the future using Date objects
      if (new Date(fd) > new Date(today)) {
        set({ error: 'Cannot create entries for future dates' });
        return null;
      }

      const response = await supabaseDatabase.entries.create(userId, journalId, content, fd, title);
      
      if (response.success && response.data) {
        // Add to local state
        const { entries } = get();
        const updatedEntries = [...entries, response.data];
        set({ entries: updatedEntries });
        
        return { id: response.data.id };
      } else {
        set({ error: response.error || 'Failed to create journal entry' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry';
      set({ error: errorMessage });
      return null;
    }
  },

  updateEntry: async (entryId: string, updates: Partial<Entry>) => {
    try {
      const response = await supabaseDatabase.entries.update(entryId, updates);
      
      if (response.success && response.data) {
        const { entries } = get();
        const entryIndex = entries.findIndex(e => e.id === entryId);
        
        if (entryIndex !== -1) {
          const updatedEntries = [...entries];
          updatedEntries[entryIndex] = response.data;
          set({ entries: updatedEntries });
        }

        return response.data;
      } else {
        set({ error: response.error || 'Failed to update entry' });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update entry';
      set({ error: errorMessage });
      return null;
    }
  },

  archiveEntry: async (entryId: string) => {
    return get().updateEntry(entryId, { isArchived: true });
  },

  deleteEntry: async (entryId: string) => {
    try {
      const response = await supabaseDatabase.entries.delete(entryId);
      
      if (response.success) {
        const { entries } = get();
        const updatedEntries = entries.filter(e => e.id !== entryId);
        set({ entries: updatedEntries });
      } else {
        set({ error: response.error || 'Failed to delete entry' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete entry';
      set({ error: errorMessage });
    }
  },

  getEntries: (journalId?: string, includeArchived = false) => {
    const { entries, currentJournal } = get();
    const targetJournalId = journalId || currentJournal?.id;
    
    if (!targetJournalId) return [];

    return entries
      .filter(entry => 
        entry.journalId === targetJournalId && 
        (includeArchived || !entry.isArchived)
      )
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  },

  getEntry: (entryId: string) => {
    const { entries } = get();
    return entries.find(e => e.id === entryId);
  },

  searchEntries: (query: string, journalId?: string) => {
    const entries = get().getEntries(journalId, false);
    const lowercaseQuery = query.toLowerCase();
    
    return entries.filter(entry =>
      entry.content.toLowerCase().includes(lowercaseQuery)
    );
  },

  getDashboardStats: () => {
    const { currentJournal } = get();
    if (!currentJournal) return null;

    const currentJournalEntries = get().getEntries(currentJournal.id, true);
    const activeEntries = currentJournalEntries.filter(e => !e.isArchived);
    
    // Calculate writing streak
    const streak = get().calculateWritingStreak();
    
    // Get recent entries
    const recentEntries = activeEntries.slice(0, 5);
    
    return {
      totalEntries: activeEntries.length,
      archivedEntries: currentJournalEntries.filter(e => e.isArchived).length,
      writingStreak: streak,
      lastEntryDate: activeEntries.length > 0 ? activeEntries[0].entryDate : null,
      recentEntries,
      currentJournal
    };
  },

  calculateWritingStreak: () => {
    const { currentJournal } = get();
    const activeEntries = get().getEntries(currentJournal?.id);
    
    if (activeEntries.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check each day going backwards
    while (true) {
      const dateString = currentDate.toISOString().split('T')[0];
      const hasEntry = activeEntries.some(entry => entry.entryDate === dateString);
      
      if (hasEntry) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today has no entry, that's okay, but if yesterday has no entry, break
        if (streak === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return streak;
  },

  exportJournal: (journalId?: string, format = 'text') => {
    const { currentJournal, journals } = get();
    const targetJournalId = journalId || currentJournal?.id;
    
    if (!targetJournalId) return null;

    const journal = journals.find(j => j.id === targetJournalId);
    const entries = get().getEntries(targetJournalId, false);

    if (format === 'text') {
      let content = `${journal?.journalName}\n`;
      content += `Created: ${new Date(journal?.createdAt || '').toLocaleDateString()}\n`;
      content += `Total Entries: ${entries.length}\n\n`;
      content += '=' + '='.repeat(50) + '\n\n';

      entries.forEach(entry => {
        content += `Date: ${new Date(entry.entryDate).toLocaleDateString()}\n`;
        content += '-'.repeat(30) + '\n';
        content += entry.content + '\n\n';
      });

      return content;
    }

    return null;
  },

  clearError: () => {
    set({ error: null });
  }
    }),
    {
      name: 'sistahology-journal',
      partialize: (state) => ({ 
        journals: state.journals, 
        currentJournal: state.currentJournal 
      }),
    }
  )
);

// Custom hooks for easier usage  
export const useJournal = () => {
  const store = useJournalStore();
  
  return {
    journals: store.journals,
    currentJournal: store.currentJournal,
    entries: store.entries,
    isLoading: store.isLoading,
    error: store.error,
    loadJournals: store.loadJournals,
    loadEntries: store.loadEntries,
    createJournal: store.createJournal,
    updateJournal: store.updateJournal,
    deleteJournal: store.deleteJournal,
    setCurrentJournal: store.setCurrentJournal,
    createEntry: store.createEntry,
    createJournalEntry: store.createJournalEntry,
    updateEntry: store.updateEntry,
    archiveEntry: store.archiveEntry,
    deleteEntry: store.deleteEntry,
    getEntries: store.getEntries,
    getEntry: store.getEntry,
    searchEntries: store.searchEntries,
    getDashboardStats: store.getDashboardStats,
    calculateWritingStreak: store.calculateWritingStreak,
    exportJournal: store.exportJournal,
    clearError: store.clearError,
  };
};