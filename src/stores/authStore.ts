import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { supabaseAuth } from '../lib/supabase-auth';
import { convertSupabaseToReact } from '../types/supabase';
import type { User, AuthState, LoginCredentials, RegisterData, ApiResponse } from '../types';
import type { Profile } from '../types/supabase';

interface AuthStore extends AuthState {
  profile: Profile | null;
  isReady: boolean;
  // Actions
  login: (credentials: LoginCredentials) => Promise<ApiResponse<User>>;
  register: (data: RegisterData) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  forceResetLoadingState: () => void;
  loadUserSession: () => Promise<void>;
  resetAuthState: () => void;
  ensureSessionLoaded: () => Promise<void>;
  retryAuth: () => Promise<void>;
}

// Ref to prevent multiple session loads (StrictMode-safe)
const sessionLoadRef = { current: false };

// Helper to add timeout to promises without unsafe type casting
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('Operation timeout')), ms)
  );
  return Promise.race([promise, timeoutPromise]);
}

export const useAuthStore = create<AuthStore>()((set, _get) => ({
      // Initial state
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      isReady: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
        set({ isLoading: true, error: null });
        
        try {
          // Add timeout protection to prevent hanging login
          const response = await withTimeout(
            supabaseAuth.signIn(credentials),
            15000 // 15 second timeout
          );
          
          if (response.success && response.data?.profile) {
            const user = convertSupabaseToReact.profile(
              response.data.profile,
              response.data
            );
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });

            return { success: true, data: user };
          } else if (response.success && response.data && !response.data.profile) {
            set({ isLoading: false, error: 'User profile not found. Please contact support.' });
            return { success: false, error: 'User profile not found. Please contact support.' };
          } else {
            const errorMessage = response.error || 'Login failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Handle timeout specifically
          if (errorMessage.includes('timeout')) {
            set({ isLoading: false, error: 'Login request timed out. Please check your connection and try again.' });
            return { success: false, error: 'Login request timed out. Please check your connection and try again.' };
          }
          
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      register: async (data: RegisterData): Promise<ApiResponse<User>> => {
        set({ isLoading: true, error: null });

        try {
          const response = await supabaseAuth.signUp(data);
          
          if (response.success && response.data?.profile) {
            const user = convertSupabaseToReact.profile(
              response.data.profile,
              response.data
            );
            
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });

            return { success: true, data: user };
          } else if (response.success && response.data && !response.data.profile) {
            throw new Error('User profile not found. Registration may have failed.');
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        console.log('Auth store logout called');
        
        // Clear state immediately
        set({ 
          user: null,
          profile: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        });
        
        // Clear all auth-related storage
        try {
          localStorage.removeItem('sistahology-auth');
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        } catch (error) {
          console.error('Storage clear error:', error);
        }
        
        // Sign out from Supabase
        try {
          await supabase.auth.signOut();
          console.log('Supabase signOut completed');
        } catch (error) {
          console.error('Supabase logout error (ignored):', error);
        }
        
        console.log('Auth store logout completed');
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      forceResetLoadingState: () => {
        console.log('Force resetting loading state');
        set({ isLoading: false, error: null });
      },

      loadUserSession: async () => {
        // Use ref to prevent multiple session loads (StrictMode-safe)
        if (sessionLoadRef.current) {
          console.log('Session load already in progress, skipping');
          return;
        }

        try {
          sessionLoadRef.current = true;
          set({ isLoading: true, error: null });
          console.log('Loading user session with timeout (ref flag set)');
          
          // Add timeout to prevent hanging (increased to 10s for better reliability)
          const userWithProfile = await withTimeout(
            supabaseAuth.getCurrentUser(),
            10000
          );
          
          if (userWithProfile?.profile) {
            const user = convertSupabaseToReact.profile(
              userWithProfile.profile,
              userWithProfile
            );
            
            console.log('User session loaded successfully:', user.name);
            set({ 
              user, 
              profile: userWithProfile.profile,
              isAuthenticated: true,
              isLoading: false,
              isReady: true,
              error: null 
            });
          } else {
            console.log('No user session found');
            set({ 
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              isReady: true,
              error: null 
            });
          }
        } catch (error) {
          console.log('Session load failed/timeout, setting unauthenticated:', error instanceof Error ? error.message : String(error));
          set({ 
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            isReady: true,
            error: error instanceof Error ? error.message : String(error)
          });
        } finally {
          sessionLoadRef.current = false;
          console.log('[DEBUG] Session load completed, ref flag cleared');
        }
      },

      resetAuthState: () => {
        console.log('Resetting auth state to initial values');
        set({ 
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          isReady: false,
          error: null 
        });
        // Clear persisted storage and reset singleton ref
        localStorage.removeItem('sistahology-auth');
        sessionLoadRef.current = false;
      },

      ensureSessionLoaded: async () => {
        const state = _get();
        
        // If auth is ready, no need to load session
        if (state.isReady) {
          console.log('Session already ready, skipping');
          return;
        }
        
        // If session load is in progress, wait for it but with timeout
        if (sessionLoadRef.current) {
          console.log('Session load in progress, waiting...');
          
          // Wait for session load to complete with timeout
          const maxWaitTime = 10000; // 10 seconds
          const startTime = Date.now();
          
          while (sessionLoadRef.current && !_get().isReady && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
          }
          
          // If still not ready after waiting, force a retry
          if (!_get().isReady) {
            console.warn('Session load timed out, forcing retry');
            sessionLoadRef.current = false;
            await _get().loadUserSession();
          }
          
          return;
        }
        
        // Start fresh session load
        await _get().loadUserSession();
      },

      retryAuth: async () => {
        console.log('Retrying auth bootstrap');
        // Reset state and force new session load
        sessionLoadRef.current = false;
        set({ isReady: false, error: null });
        await _get().loadUserSession();
      }
    }));

// Legacy auth listener functions removed - now using singleton authListener.ts

// Initialize auth system using environment-aware runtime
import { initAuth } from '../lib/authRuntime';
initAuth();

// Custom hooks for easier usage
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isReady: store.isReady,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
    forceResetLoadingState: store.forceResetLoadingState,
    loadUserSession: store.loadUserSession,
    resetAuthState: store.resetAuthState,
    ensureSessionLoaded: store.ensureSessionLoaded,
    retryAuth: store.retryAuth,
  };
};