/**
 * AuthContext - Official Supabase + React Context Pattern
 *
 * This replaces the custom Zustand-based auth system with the official
 * Supabase-recommended approach. Key benefits:
 *
 * 1. Single source of truth: Supabase session (no localStorage duplication)
 * 2. Automatic tab recovery: Supabase handles visibility changes natively
 * 3. Simpler code: ~150 lines vs ~800 lines in the old system
 * 4. No custom singleton or ref guards needed
 *
 * The useAuth() hook interface is preserved for backwards compatibility.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseAuth } from '../lib/supabase-auth';
import { convertSupabaseToReact } from '../types/supabase';
import type { User, LoginCredentials, RegisterData, ApiResponse } from '../types';
import type { Profile } from '../types/supabase';
import type { Session } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

interface AuthContextType {
  // State
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isReady: boolean;
  isAdmin: boolean;
  error: string | null;

  // Actions (same interface as old useAuth)
  login: (credentials: LoginCredentials) => Promise<ApiResponse<User>>;
  register: (data: RegisterData) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  clearError: () => void;
  forceResetLoadingState: () => void;
  loadUserSession: () => Promise<void>;
  resetAuthState: () => void;
  ensureSessionLoaded: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// Multi-Tab Logout Coordination
// ============================================================================

// BroadcastChannel to sync logout across tabs
// This prevents desync when user logs out in one tab but other tabs still show logged in
const logoutChannel = typeof window !== 'undefined'
  ? new BroadcastChannel('sistahology-logout')
  : null;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clear all auth-related storage on logout
 * Preserves privacy by removing user data when switching accounts
 */
async function clearAuthStorage() {
  try {
    // Calculate correct Supabase storage key from project URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectId = projectIdMatch ? projectIdMatch[1] : '';

    // Build mode-specific custom key
    const mode = import.meta.env.MODE || 'development';
    const customStorageKey = `sistahology-auth-${mode}`;

    // Build Supabase internal storage key
    const supabaseStorageKey = projectId ? `sb-${projectId}-auth-token` : '';

    // Remove all potential auth keys AND user data keys
    const keysToRemove = [
      'sistahology-auth',           // Legacy key
      customStorageKey,             // Mode-specific custom key
      'supabase.auth.token',        // Old key
      supabaseStorageKey,           // Supabase internal key
      'sistahology-journal'         // Clear user's journal data (privacy)
    ];

    keysToRemove.forEach(key => {
      if (key) {
        localStorage.removeItem(key);
      }
    });

    // Safety scan: Remove any remaining sb-*-auth-token keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sb-') && key.includes('-auth-token')) {
        localStorage.removeItem(key);
      }
    }

    // Clear session storage auth token
    sessionStorage.removeItem('supabase.auth.token');

  } catch (error) {
    console.error('Storage clear error:', error);
  }
}

/**
 * Clear journal store on logout to prevent data leakage
 */
async function clearJournalStore() {
  try {
    const { useJournalStore } = await import('../stores/journalStore');
    useJournalStore.setState({ isLoading: false, error: null, journals: [], entries: [], currentJournal: null });
  } catch (error) {
    console.error('Failed to clear journal state on logout:', error);
  }
}

/**
 * Fetch admin status from profiles table
 */
async function fetchAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    return data?.is_admin || false;
  } catch {
    return false;
  }
}

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // Core state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we're in initial page load phase
  // Only check shouldAutoLogout during initial load, not for fresh logins
  const isInitialLoadRef = useRef(true);

  // Derived state - base authentication on session only
  // User profile is optional enhancement, not required for authentication
  const isAuthenticated = !!session?.user;

  // Provide fallback user from session if profile hasn't loaded yet
  // This ensures Navigation can show user info even during slow profile fetches
  const effectiveUser: User | null = user ?? (session?.user ? {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
    createdAt: session.user.created_at,
    theme: 'pink'
  } : null);

  // ============================================================================
  // Session Initialization (Official Supabase Pattern)
  // ============================================================================

  useEffect(() => {
    // Check remember-me preference SYNCHRONOUSLY first
    // This value is used by both getSession and onAuthStateChange handlers
    // to prevent the race condition that causes "flash of authenticated UI"
    const rememberMePref = localStorage.getItem('sistahology-remember-me');
    const shouldAutoLogout = rememberMePref === 'false';

    // Get initial session with error handling
    supabase.auth.getSession()
      .then(async ({ data: { session: initialSession } }) => {
        // Use the synchronously-read preference (shouldAutoLogout)
        if (initialSession && shouldAutoLogout) {
          // User doesn't want to be remembered - sign out immediately
          console.log('[AuthContext] Remember me disabled, signing out');
          await supabase.auth.signOut({ scope: 'local' });
          await clearAuthStorage();
          isInitialLoadRef.current = false;
          setIsReady(true);
          return;
        }

        setSession(initialSession);

        if (initialSession?.user) {
          // Fetch full profile
          try {
            const userWithProfile = await supabaseAuth.getCurrentUser();
            if (userWithProfile?.profile) {
              const reactUser = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
              setUser(reactUser);
              setProfile(userWithProfile.profile);
              setIsAdmin(await fetchAdminStatus(userWithProfile.id));
            }
          } catch (profileError) {
            console.error('[AuthContext] Error fetching profile:', profileError);
            // Session exists but profile fetch failed - continue as logged out
          }
        }

        isInitialLoadRef.current = false;
        setIsReady(true);
      })
      .catch((error) => {
        // Network error, Supabase down, etc - still set isReady so app renders
        console.error('[AuthContext] Error getting session:', error);
        isInitialLoadRef.current = false;
        setIsReady(true);
      });

    // Subscribe to auth changes (handles tab visibility automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AuthContext] Auth state changed:', event);

        // Check remember-me ONLY during initial page load
        // Fresh logins should always be accepted (user just entered credentials)
        if (newSession && shouldAutoLogout && isInitialLoadRef.current) {
          console.log('[AuthContext] Remember me disabled, skipping session from:', event);
          // Don't set session - the getSession handler will sign out
          return;
        }

        setSession(newSession);

        // Set isReady immediately so UI can render
        setIsReady(true);

        if (newSession?.user) {
          // Profile fetch is enhancement, don't block on it
          // Use timeout to prevent hanging on slow/failed requests
          try {
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );
            const profilePromise = supabaseAuth.getCurrentUser();

            const userWithProfile = await Promise.race([profilePromise, timeoutPromise]);

            if (userWithProfile?.profile) {
              const reactUser = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
              setUser(reactUser);
              setProfile(userWithProfile.profile);
              setIsAdmin(await fetchAdminStatus(userWithProfile.id));
            }
          } catch (profileError) {
            console.warn('[AuthContext] Profile fetch failed/timeout:', profileError);
            // Session is still valid, just couldn't get profile
            // User can still access protected routes
          }
        } else {
          // User signed out
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    // Listen for logout from other tabs
    if (logoutChannel) {
      logoutChannel.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          console.log('[AuthContext] Logout detected from another tab');
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setIsReady(true);
        }
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // Actions
  // ============================================================================

  const login = useCallback(async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabaseAuth.signIn(credentials);

      if (response.success && response.data?.profile) {
        const reactUser = convertSupabaseToReact.profile(response.data.profile, response.data);
        const adminStatus = await fetchAdminStatus(response.data.id);

        setUser(reactUser);
        setProfile(response.data.profile);
        setIsAdmin(adminStatus);
        setIsLoading(false);

        return { success: true, data: reactUser };
      } else if (response.success && response.data && !response.data.profile) {
        setIsLoading(false);
        setError('User profile not found. Please contact support.');
        return { success: false, error: 'User profile not found. Please contact support.' };
      } else {
        const errorMessage = response.error || 'Login failed';
        setIsLoading(false);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await supabaseAuth.signUp(data);

      if (response.success && response.data?.profile) {
        const reactUser = convertSupabaseToReact.profile(response.data.profile, response.data);
        const adminStatus = await fetchAdminStatus(response.data.id);

        setUser(reactUser);
        setProfile(response.data.profile);
        setIsAdmin(adminStatus);
        setIsLoading(false);

        return { success: true, data: reactUser };
      } else if (response.success && response.data && !response.data.profile) {
        throw new Error('User profile not found. Registration may have failed.');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setIsLoading(false);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[AuthContext] Logout called');

    // Broadcast logout to other tabs FIRST
    try {
      logoutChannel?.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
    } catch (err) {
      console.error('[AuthContext] Failed to broadcast logout:', err);
    }

    // Clear journal store
    await clearJournalStore();

    // Clear state immediately
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setSession(null);
    setIsReady(false);
    setError(null);

    // Clear storage
    await clearAuthStorage();

    // Sign out from Supabase
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[AuthContext] Supabase signOut error:', err);
    }

    // Re-enable isReady so login page works
    setIsReady(true);

    console.log('[AuthContext] Logout completed');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const forceResetLoadingState = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const loadUserSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userWithProfile = await supabaseAuth.getCurrentUser();

      if (userWithProfile?.profile) {
        const reactUser = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
        const adminStatus = await fetchAdminStatus(userWithProfile.id);

        setUser(reactUser);
        setProfile(userWithProfile.profile);
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('[AuthContext] Session load error:', err);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  const resetAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
    setIsLoading(false);
    setIsReady(false);
    setError(null);
    localStorage.removeItem('sistahology-auth');
  }, []);

  const ensureSessionLoaded = useCallback(async () => {
    if (!isReady) {
      await loadUserSession();
    }
  }, [isReady, loadUserSession]);

  const retryAuth = useCallback(async () => {
    console.log('[AuthContext] Retrying auth');
    setIsReady(false);
    setError(null);
    await loadUserSession();
  }, [loadUserSession]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextType = {
    user: effectiveUser,
    profile,
    isAuthenticated,
    isLoading,
    isReady,
    isAdmin,
    error,
    login,
    register,
    logout,
    clearError,
    forceResetLoadingState,
    loadUserSession,
    resetAuthState,
    ensureSessionLoaded,
    retryAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
