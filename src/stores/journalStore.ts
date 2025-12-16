import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseDatabase } from '../lib/supabase-database';
import { requireSession } from '../lib/session';
// Removed unused convertSupabaseToReact import
import type { Journal, Entry, JournalState, DashboardStats } from '../types';

interface JournalStore extends JournalState {
  // Actions
  loadJournals: (userId: string) => Promise<boolean>;
  loadEntries: (userId: string) => Promise<void>;
  createJournal: (userId: string, journalName: string, color?: string, icon?: string) => Promise<Journal | null>;
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
  // Trash bin methods
  getTrashedEntries: (userId: string) => Promise<Entry[]>;
  recoverEntry: (entryId: string) => Promise<void>;
  bulkRecoverEntries: (entryIds: string[]) => Promise<void>;
  permanentDeleteEntry: (entryId: string) => Promise<void>;
  cleanupOldTrashedEntries: () => Promise<number>;
  bulkDeleteEntries: (entryIds: string[]) => Promise<void>;
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
    console.log('[TAB-SWITCH-DEBUG] journalStore.loadJournals called', {
      userId,
      currentIsLoading: get().isLoading,
      timestamp: new Date().toISOString()
    });

    try {
      set({ isLoading: true, error: null });
      console.log('[TAB-SWITCH-DEBUG] journalStore: Set isLoading=true');

      const response = await supabaseDatabase.journals.getAll(userId);

      console.log('[TAB-SWITCH-DEBUG] journalStore: Journals fetch response', {
        success: response.success,
        journalCount: response.data?.length,
        error: response.error
      });

      if (response.success && response.data) {
        const journals = response.data;

        // Set current journal to most recent one if exists
        const sortedJournals = journals.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        const currentJournal = sortedJournals.length > 0 ? sortedJournals[0] : null;

        set({
          journals: sortedJournals,
          currentJournal
        });

        // Load entries after journals are loaded
        if (journals.length > 0) {
          console.log('[TAB-SWITCH-DEBUG] journalStore: Loading entries for', journals.length, 'journals');
          await get().loadEntries(userId);
          console.log('[TAB-SWITCH-DEBUG] journalStore: Entries loaded');
        }

        return true;
      } else {
        const errorMessage = response.error || 'Failed to load journals';
        console.error('[TAB-SWITCH-DEBUG] journalStore: Failed to load journals:', errorMessage);
        set({ error: errorMessage, journals: [] });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load journals';
      console.error('[TAB-SWITCH-DEBUG] journalStore: Exception in loadJournals:', error);
      set({ error: errorMessage, journals: [] });
      return false;
    } finally {
      // ALWAYS clear loading state, even if loadEntries fails
      set({ isLoading: false });
      console.log('[TAB-SWITCH-DEBUG] journalStore: Set isLoading=false in finally block', {
        timestamp: new Date().toISOString()
      });
    }
  },

  loadEntries: async (userId: string) => {
    console.log('[TAB-SWITCH-DEBUG] journalStore.loadEntries called', {
      userId,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await supabaseDatabase.entries.getAllForUser(userId, true); // Include archived

      console.log('[TAB-SWITCH-DEBUG] journalStore: Entries fetch response', {
        success: response.success,
        entryCount: response.data?.length,
        error: response.error
      });

      if (response.success && response.data) {
        set({ entries: response.data });
      } else {
        console.error('[TAB-SWITCH-DEBUG] journalStore: Error loading entries:', response.error);
        console.error('Error loading entries:', response.error);
        set({ entries: [] });
      }
    } catch (error) {
      console.error('[TAB-SWITCH-DEBUG] journalStore: Exception in loadEntries:', error);
      console.error('Error loading entries:', error);
      set({ entries: [] });
    }
  },

  createJournal: async (userId: string, journalName: string, color = '#F5C3E2', icon?: string) => {
    try {
      await requireSession();
      const response = await supabaseDatabase.journals.create(userId, journalName, color, icon);

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
      await requireSession();
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
      await requireSession();
      const { journals, entries, currentJournal } = get();


      const response = await supabaseDatabase.journals.delete(journalId);
      
      if (response.success) {
        // Remove journal and its entries from local state
        const updatedJournals = journals.filter(j => j.id !== journalId);
        const updatedEntries = entries.filter(e => e.journalId !== journalId);

        // Update current journal if necessary
        const newCurrentJournal = currentJournal?.id === journalId 
          ? (updatedJournals.length > 0 ? updatedJournals[0] : null)
          : currentJournal;

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
      await requireSession();
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
      await requireSession();
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
      await requireSession();
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
      await requireSession();
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
    const { currentJournal, entries } = get();
    if (!currentJournal) return null;

    const currentJournalEntries = get().getEntries(currentJournal.id, true);
    const activeEntries = currentJournalEntries.filter(e => !e.isArchived);

    // Calculate writing streak
    const streak = get().calculateWritingStreak();

    // Get recent entries (for display in recent entries list)
    const recentEntries = activeEntries.slice(0, 5);

    // Get all entries across all journals (for widget calculations)
    const allActiveEntries = entries.filter(e => !e.isArchived)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    return {
      totalEntries: activeEntries.length,
      archivedEntries: currentJournalEntries.filter(e => e.isArchived).length,
      writingStreak: streak,
      lastEntryDate: activeEntries.length > 0 ? activeEntries[0].entryDate : null,
      recentEntries,
      currentJournal,
      allEntries: allActiveEntries // All entries for widgets
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
  },

  // Trash bin operations
  getTrashedEntries: async (userId: string) => {
    try {
      const response = await supabaseDatabase.entries.getTrashed(userId);

      if (response.success && response.data) {
        return response.data;
      } else {
        console.error('Error loading trashed entries:', response.error);
        return [];
      }
    } catch (error) {
      console.error('Error loading trashed entries:', error);
      return [];
    }
  },

  recoverEntry: async (entryId: string) => {
    try {
      await requireSession();
      const response = await supabaseDatabase.entries.recover(entryId);

      if (response.success && response.data) {
        // Add recovered entry back to local state
        const { entries } = get();
        const updatedEntries = [...entries, response.data];
        set({ entries: updatedEntries });
      } else {
        set({ error: response.error || 'Failed to recover entry' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to recover entry';
      set({ error: errorMessage });
    }
  },

  bulkRecoverEntries: async (entryIds: string[]) => {
    try {
      await requireSession();
      const response = await supabaseDatabase.entries.bulkRecover(entryIds);

      if (response.success && response.data) {
        // Add all recovered entries back to local state
        const { entries } = get();
        const updatedEntries = [...entries, ...response.data];
        set({ entries: updatedEntries });
      } else {
        set({ error: response.error || 'Failed to recover entries' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to recover entries';
      set({ error: errorMessage });
    }
  },

  permanentDeleteEntry: async (entryId: string) => {
    try {
      await requireSession();
      const response = await supabaseDatabase.entries.permanentDelete(entryId);

      if (!response.success) {
        set({ error: response.error || 'Failed to permanently delete entry' });
      }
      // Note: Entry is already not in local state since it was soft-deleted
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to permanently delete entry';
      set({ error: errorMessage });
    }
  },

  cleanupOldTrashedEntries: async () => {
    try {
      await requireSession();
      const response = await supabaseDatabase.entries.cleanupOldTrashed();

      if (response.success) {
        return response.data || 0;
      } else {
        console.error('Error cleaning up old trashed entries:', response.error);
        return 0;
      }
    } catch (error) {
      console.error('Error cleaning up old trashed entries:', error);
      return 0;
    }
  },

  bulkDeleteEntries: async (entryIds: string[]) => {
    try {
      await requireSession();
      const response = await supabaseDatabase.entries.bulkSoftDelete(entryIds);

      if (response.success) {
        // Remove deleted entries from local state
        const { entries } = get();
        const updatedEntries = entries.filter(e => !entryIds.includes(e.id));
        set({ entries: updatedEntries });
      } else {
        set({ error: response.error || 'Failed to delete entries' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete entries';
      set({ error: errorMessage });
    }
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
    getTrashedEntries: store.getTrashedEntries,
    recoverEntry: store.recoverEntry,
    bulkRecoverEntries: store.bulkRecoverEntries,
    permanentDeleteEntry: store.permanentDeleteEntry,
    cleanupOldTrashedEntries: store.cleanupOldTrashedEntries,
    bulkDeleteEntries: store.bulkDeleteEntries,
  };
};