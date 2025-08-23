import { supabase } from './supabase'
import type { 
  JournalSubscriptionPayload,
  EntrySubscriptionPayload
} from '../types/supabase'
import { convertSupabaseToReact } from '../types/supabase'
import type { Journal, Entry, ApiResponse } from '../types'

// Database operations
export const supabaseDatabase = {
  // Journal operations
  journals: {
    // Get all journals for a user
    async getAll(userId: string): Promise<ApiResponse<Journal[]>> {
      try {
        const { data, error } = await supabase
          .from('journal')  // Singular table name
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const journals = (data || []).map(journal => 
          convertSupabaseToReact.journal(journal)
        );

        return { success: true, data: journals };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load journals';
        return { success: false, error: errorMessage };
      }
    },

    // Create new journal
    async create(userId: string, journalName: string, color = '#F5C3E2'): Promise<ApiResponse<Journal>> {
      try {
        const journalData = {
          user_id: userId,
          journal_name: journalName.trim(),
          color
          // created_at and updated_at are handled by defaults
        };

        const { data, error } = await supabase
          .from('journal')
          .insert([journalData])
          .select()
          .single();

        if (error) {
          throw error;
        }

        const journal = convertSupabaseToReact.journal(data);
        return { success: true, data: journal };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create journal';
        return { success: false, error: errorMessage };
      }
    },

    // Update journal
    async update(journalId: string, updates: Partial<Journal>): Promise<ApiResponse<Journal>> {
      try {
        const updateData = {
          ...(updates.journalName && { journal_name: updates.journalName }),
          ...(updates.color && { color: updates.color })
          // updated_at is handled by trigger
        };

        const { data, error } = await supabase
          .from('journal')
          .update(updateData)
          .eq('id', journalId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const journal = convertSupabaseToReact.journal(data);
        return { success: true, data: journal };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update journal';
        return { success: false, error: errorMessage };
      }
    },

    // Delete journal
    async delete(journalId: string): Promise<ApiResponse<void>> {
      try {
        // First delete all entries in this journal
        const { error: entriesError } = await supabase
          .from('entry')
          .delete()
          .eq('journal_id', journalId);

        if (entriesError) {
          throw entriesError;
        }

        // Then delete the journal
        const { error: journalError } = await supabase
          .from('journal')
          .delete()
          .eq('id', journalId);

        if (journalError) {
          throw journalError;
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete journal';
        return { success: false, error: errorMessage };
      }
    },

    // Subscribe to journal changes
    subscribe(userId: string, callback: (payload: JournalSubscriptionPayload) => void) {
      return supabase
        .channel(`journal:user_id=eq.${userId}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'journal',
            filter: `user_id=eq.${userId}`
          } as any,
          callback
        )
        .subscribe();
    }
  },

  // Entry operations
  entries: {
    // Get all entries for a journal
    async getAll(journalId: string, includeArchived = false): Promise<ApiResponse<Entry[]>> {
      try {
        let query = supabase
          .from('entry')
          .select('*')
          .eq('journal_id', journalId)
          .order('entry_date', { ascending: false });

        if (!includeArchived) {
          query = query.eq('is_archived', false);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const entries = (data || []).map(entry => 
          convertSupabaseToReact.entry(entry)
        );

        return { success: true, data: entries };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load entries';
        return { success: false, error: errorMessage };
      }
    },

    // Get all entries for a user (across all journals)
    async getAllForUser(_userId: string, includeArchived = false): Promise<ApiResponse<Entry[]>> {
      try {
        // Note: entry table doesn't have user_id, so we need to join with journal
        let query = supabase
          .from('entry')
          .select(`
            *,
            journal:journal_id(
              user_id
            )
          `)
          .order('entry_date', { ascending: false });

        if (!includeArchived) {
          query = query.eq('is_archived', false);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const entries = (data || []).map(entry => 
          convertSupabaseToReact.entry(entry)
        );

        return { success: true, data: entries };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load entries';
        return { success: false, error: errorMessage };
      }
    },

    // Create new entry
    async create(userId: string, journalId: string, content: string, entryDate?: string, title?: string): Promise<ApiResponse<Entry>> {
      try {
        // Local date formatter (no timezone shift)
        function toYYYYMMDD(d: string | Date): string {
          if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
          const dt = new Date(d);
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const day = String(dt.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
        
        const selectedDate = toYYYYMMDD(entryDate || new Date());

        const entryData = {
          user_id: userId,
          journal_id: journalId,
          content: content.trim(),
          entry_date: selectedDate,
          is_archived: false,
          ...(title && { title: title.trim() })
          // created_at and updated_at handled by defaults
        };

        const { data, error } = await supabase
          .from('entry')
          .insert([entryData])
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        // For createJournalEntry compatibility, return minimal data with id
        const entry = convertSupabaseToReact.entry({ ...entryData, id: data.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        return { success: true, data: entry };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create entry';
        return { success: false, error: errorMessage };
      }
    },

    // Update entry
    async update(entryId: string, updates: Partial<Entry>): Promise<ApiResponse<Entry>> {
      try {
        // Validate entry date if it's being updated
        if (updates.entryDate) {
          const today = new Date().toISOString().split('T')[0];
          if (updates.entryDate > today) {
            throw new Error('Journal entries cannot be dated in the future. Please select today or a past date.');
          }
        }

        const updateData = {
          ...(updates.content && { content: updates.content }),
          ...(updates.entryDate && { entry_date: updates.entryDate }),
          ...(typeof updates.isArchived === 'boolean' && { is_archived: updates.isArchived })
          // updated_at handled by trigger
        };

        const { data, error } = await supabase
          .from('entry')
          .update(updateData)
          .eq('id', entryId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const entry = convertSupabaseToReact.entry(data);
        return { success: true, data: entry };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update entry';
        return { success: false, error: errorMessage };
      }
    },

    // Archive entry
    async archive(entryId: string): Promise<ApiResponse<Entry>> {
      return this.update(entryId, { isArchived: true });
    },

    // Delete entry
    async delete(entryId: string): Promise<ApiResponse<void>> {
      try {
        const { error } = await supabase
          .from('entry')
          .delete()
          .eq('id', entryId);

        if (error) {
          throw error;
        }

        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete entry';
        return { success: false, error: errorMessage };
      }
    },

    // Search entries
    async search(_userId: string, query: string, journalId?: string): Promise<ApiResponse<Entry[]>> {
      try {
        // Since entry table doesn't have user_id, we need to filter through journal
        let supabaseQuery = supabase
          .from('entry')
          .select(`
            *,
            journal:journal_id(
              user_id
            )
          `)
          .eq('is_archived', false)
          .textSearch('content', query)
          .order('entry_date', { ascending: false });

        if (journalId) {
          supabaseQuery = supabaseQuery.eq('journal_id', journalId);
        }

        const { data, error } = await supabaseQuery;

        if (error) {
          throw error;
        }

        const entries = (data || []).map(entry => 
          convertSupabaseToReact.entry(entry)
        );

        return { success: true, data: entries };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search entries';
        return { success: false, error: errorMessage };
      }
    },

    // Subscribe to entry changes
    subscribe(journalId: string, callback: (payload: EntrySubscriptionPayload) => void) {
      return supabase
        .channel(`entry:journal_id=eq.${journalId}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'entry',
            filter: `journal_id=eq.${journalId}`
          } as any,
          callback
        )
        .subscribe();
    },

    // Subscribe to all user entries
    subscribeToUser(_userId: string, callback: (payload: EntrySubscriptionPayload) => void) {
      // Since entry table doesn't have user_id, we'll need to subscribe to all entries
      // and filter in the callback based on journal ownership
      return supabase
        .channel(`entry:all`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'entry'
          } as any,
          callback
        )
        .subscribe();
    }
  },

  // Utility functions
  async checkConnection(): Promise<boolean> {
    try {
      console.log('checkConnection: Testing database connection...');
      
      // Add timeout to prevent hanging
      const queryPromise = supabase.from('profiles').select('id').limit(1);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as any;
      
      console.log('checkConnection: Database query result', { 
        hasData: !!data, 
        error: error?.message || 'none',
        dataLength: data?.length || 0 
      });
      
      return !error;
    } catch (error) {
      console.error('checkConnection: Connection test failed', error);
      return false;
    }
  }
};