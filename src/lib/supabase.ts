import { createClient } from '@supabase/supabase-js'
import { defineSingleton } from './singleton'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  })
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// One-time cleanup of old storage keys with commit SHA pattern
// This migrates from the old format: sistahology-auth-${mode}-${commitSha}
// To the new format: sistahology-auth-${mode}
function cleanupOldStorageKeys() {
  try {
    const keysToRemove: string[] = [];

    // Find all localStorage keys matching old pattern with commit SHA
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sistahology-auth-') && key.split('-').length > 3) {
        // Old format has 4+ parts: sistahology-auth-MODE-COMMITSHA
        // New format has 3 parts: sistahology-auth-MODE
        keysToRemove.push(key);
      }
    }

    // Remove old keys
    keysToRemove.forEach(key => {
      console.log(`[Storage Migration] Removing old auth key: ${key}`);
      localStorage.removeItem(key);
    });

    if (keysToRemove.length > 0) {
      console.log(`[Storage Migration] Cleaned up ${keysToRemove.length} old storage key(s)`);
    }
  } catch (error) {
    console.warn('[Storage Migration] Failed to clean up old storage keys:', error);
  }
}

// Run cleanup before initializing Supabase
cleanupOldStorageKeys();

// HMR-safe singleton Supabase client
export const supabase = defineSingleton('__SUPABASE__', () => {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log('🔗 Initializing Supabase client (singleton)')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseAnonKey)
  }

  const mode = import.meta.env.MODE || 'development'

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: `sistahology-auth-${mode}`
    }
  })
})

// Helper function to check if user is authenticated
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}