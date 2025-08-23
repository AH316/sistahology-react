// Supabase Database Types
// Based on typical journaling app schema and Supabase Auth patterns

import type { User as SupabaseUser } from '@supabase/supabase-js'

// Supabase Profile table (matches actual schema)
export interface Profile {
  id: string; // matches auth.users.id
  name: string;
  journal_id: string | null; // FK to journal.id (user's primary journal)
}

// Journal table structure (matches actual schema)
export interface SupabaseJournal {
  id: string;
  user_id: string; // FK to auth.users.id
  journal_name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Entry table structure (matches actual schema)
export interface SupabaseEntry {
  id: string;
  journal_id: string; // FK to journal.id
  content: string;
  entry_date: string; // date format
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Combined types for React app compatibility
export interface SupabaseUserWithProfile extends SupabaseUser {
  profile?: Profile;
}

// Type mappings from our existing React types to Supabase types
export interface TypeMapping {
  // Map React User to Supabase structures
  ReactUser: {
    id: string;
    name: string;
    email: string;
    journalId: string;
    createdAt: string;
    theme?: string;
  };
  
  // Map to Supabase Profile
  SupabaseProfile: Profile;
  
  // Map React Journal to Supabase Journal  
  ReactJournal: {
    id: string;
    userId: string;
    journalName: string;
    color: string;
    createdAt: string;
    updatedAt: string;
  };
  
  SupabaseJournal: SupabaseJournal;
  
  // Map React Entry to Supabase Entry
  ReactEntry: {
    id: string;
    journalId: string;
    content: string;
    entryDate: string;
    createdAt: string;
    updatedAt: string;
    isArchived: boolean;
  };
  
  SupabaseEntry: SupabaseEntry;
}

// Conversion utilities
export const convertSupabaseToReact = {
  profile: (profile: Profile, user: SupabaseUser): TypeMapping['ReactUser'] => ({
    id: profile.id,
    name: profile.name,
    email: user.email || '', // Get email from auth user
    journalId: profile.journal_id || '', 
    createdAt: user.created_at,
    theme: 'pink' // Default theme since it's not in the schema
  }),
  
  journal: (journal: SupabaseJournal): TypeMapping['ReactJournal'] => ({
    id: journal.id,
    userId: journal.user_id,
    journalName: journal.journal_name,
    color: journal.color,
    createdAt: journal.created_at,
    updatedAt: journal.updated_at
  }),
  
  entry: (entry: SupabaseEntry): TypeMapping['ReactEntry'] => ({
    id: entry.id,
    journalId: entry.journal_id,
    content: entry.content,
    entryDate: entry.entry_date,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    isArchived: entry.is_archived
  })
};

export const convertReactToSupabase = {
  journal: (journal: TypeMapping['ReactJournal']): Omit<SupabaseJournal, 'id' | 'created_at' | 'updated_at'> => ({
    user_id: journal.userId,
    journal_name: journal.journalName,
    color: journal.color
  }),
  
  entry: (entry: TypeMapping['ReactEntry']): Omit<SupabaseEntry, 'id' | 'created_at' | 'updated_at'> => ({
    journal_id: entry.journalId,
    content: entry.content,
    entry_date: entry.entryDate,
    is_archived: entry.isArchived
  }),
  
  profile: (user: TypeMapping['ReactUser']): Omit<Profile, 'id'> => ({
    name: user.name,
    journal_id: user.journalId || null
  })
};

// Real-time subscription types
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  errors?: string[];
}

export interface JournalSubscriptionPayload extends RealtimePayload<SupabaseJournal> {}
export interface EntrySubscriptionPayload extends RealtimePayload<SupabaseEntry> {}