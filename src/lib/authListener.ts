import { supabase } from './supabase';
import { defineSingleton } from './singleton';
import { useAuthStore } from '../stores/authStore';
import { supabaseAuth } from './supabase-auth';
import { convertSupabaseToReact } from '../types/supabase';

type Cleanup = () => void;

function createAuthRuntime() {
  let unsubscribe: Cleanup | null = (globalThis as any).__AUTH_UNSUB__ ?? null;
  let recoveryListeners: Cleanup[] = [];
  
  // Get the store's setState method
  const getState = () => useAuthStore.getState();
  const setState = (state: Partial<ReturnType<typeof getState>>) => useAuthStore.setState(state);

  async function bootstrap() {
    console.debug('auth:start - beginning auth bootstrap');
    console.log('[DEBUG] Auth bootstrap: starting session fetch');
    setState({ isLoading: true });
    
    try {
      // Get current session first
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        // If we have a session, get the full user profile
        const userWithProfile = await supabaseAuth.getCurrentUser();
        
        if (userWithProfile?.profile) {
          const reactUser = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
          console.log('[DEBUG] Auth bootstrap: authenticated user found:', reactUser.id);

          // Check if user is admin
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userWithProfile.id)
            .single();

          setState({
            user: reactUser,
            profile: userWithProfile.profile,
            isAuthenticated: true,
            isAdmin: profileData?.is_admin || false,
            error: null
          });
        } else {
          console.log('[DEBUG] Auth bootstrap: session exists but no profile');
          setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
            error: null
          });
        }
      } else {
        console.log('[DEBUG] Auth bootstrap: no session found');
        setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          isAdmin: false,
          error: null
        });
      }
    } catch (e) {
      console.log('[DEBUG] Auth bootstrap: error:', e instanceof Error ? e.message : String(e));
      setState({
        user: null,
        profile: null,
        isAuthenticated: false,
        isAdmin: false,
        error: e instanceof Error ? e.message : String(e)
      });
    } finally {
      setState({ isLoading: false, isReady: true });
      console.debug('auth:ready - auth bootstrap completed');
      console.log('[DEBUG] Auth bootstrap: completed');
    }
  }

  async function checkSessionNow() {
    if (import.meta.env.VITE_DEBUG_AUTH) {
      console.debug('Auth: checking session now (recovery)');
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      const currentState = getState();
      const shouldUpdate = (!currentState.isAuthenticated && session?.user) || 
                          (currentState.isAuthenticated && !session?.user);
      
      if (shouldUpdate) {
        if (import.meta.env.VITE_DEBUG_AUTH) {
          console.debug('Auth: session state changed, updating');
        }
        await bootstrap();
      }
    } catch (error) {
      if (import.meta.env.VITE_DEBUG_AUTH) {
        console.debug('Auth: session check failed', error);
      }
    }
  }

  function setupRecoveryListeners() {
    // Clean up existing listeners
    recoveryListeners.forEach(cleanup => cleanup());
    recoveryListeners = [];

    // NOTE: Visibility change listener disabled - storage key fix ensures sessions persist
    // across tabs without needing aggressive re-checks that cause loading state churn

    // Online event - check session when network reconnects
    const onOnline = () => {
      if (import.meta.env.VITE_DEBUG_AUTH) {
        console.debug('Auth: network came online, checking session');
      }
      checkSessionNow();
    };

    window.addEventListener('online', onOnline);

    recoveryListeners.push(
      () => window.removeEventListener('online', onOnline)
    );
  }

  function start() {
    if (unsubscribe) {
      console.log('[DEBUG] Auth listener: already started, skipping');
      return;
    }
    
    // Setup recovery listeners for tab visibility and network changes
    setupRecoveryListeners();
    
    console.log('[AUTH] listener registered once');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentState = getState();

      // Only update state if user ID actually changed (login/logout), not on token refresh
      if (session?.user) {
        // If we already have this user AND this is a token refresh event, skip update
        // CRITICAL: Only skip on TOKEN_REFRESHED event, not on SIGNED_IN
        // This allows logout→login cycles of the same user to properly update state
        if (currentState.user?.id === session.user.id && currentState.isAuthenticated && event === 'TOKEN_REFRESHED') {
          if (import.meta.env.VITE_DEBUG_AUTH) {
            console.debug('Auth: same user token refresh, skipping state update');
          }
          return;
        }

        // Get full user profile on auth change
        const userWithProfile = await supabaseAuth.getCurrentUser();

        if (userWithProfile?.profile) {
          const reactUser = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);

          // Check if user is admin
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userWithProfile.id)
            .single();

          setState({
            user: reactUser,
            profile: userWithProfile.profile,
            isAuthenticated: true,
            isAdmin: profileData?.is_admin || false,
            error: null
          });
        } else {
          setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
            error: null
          });
        }
      } else {
        // Only update if we were authenticated (prevents re-renders when already logged out)
        if (currentState.isAuthenticated) {
          setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            isAdmin: false,
            error: null
          });
        }
      }
    });
    
    unsubscribe = () => {
      console.log('[DEBUG] Auth listener: unsubscribing');
      subscription?.unsubscribe();
    };
    (globalThis as any).__AUTH_UNSUB__ = unsubscribe;
  }

  function stop() {
    console.log('[DEBUG] Auth runtime: stopping');
    unsubscribe?.();
    (globalThis as any).__AUTH_UNSUB__ = null;
    unsubscribe = null;

    // Clean up recovery listeners
    recoveryListeners.forEach(cleanup => cleanup());
    recoveryListeners = [];
  }

  function reset() {
    console.log('[DEBUG] Auth runtime: resetting for logout');
    // Stop the current auth listener to allow re-initialization
    stop();
    // Note: We don't call start() here - let the next mount trigger it naturally
    // This prevents "Session already ready, skipping" on logout→login cycles
  }

  return { bootstrap, start, stop, reset, checkSessionNow };
}

// Global singleton that survives HMR
export const authRuntime = defineSingleton('__AUTH_RUNTIME__', createAuthRuntime);

// Helper to init once (dev environment)
export async function initAuthDev() {
  console.log('[DEBUG] initAuthDev: starting auth runtime (development)');
  authRuntime.start();
  await authRuntime.bootstrap();
}

// HMR cleanup
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('[DEBUG] HMR cleanup: stopping auth runtime');
    const unsub = (globalThis as any).__AUTH_UNSUB__;
    unsub?.();
    (globalThis as any).__AUTH_UNSUB__ = null;
    authRuntime.stop();
  });
}