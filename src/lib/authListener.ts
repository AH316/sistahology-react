import { supabase } from './supabase';
import { defineSingleton } from './singleton';
import { useAuthStore } from '../stores/authStore';
import { supabaseAuth } from './supabase-auth';
import { convertSupabaseToReact } from '../types/supabase';

type Cleanup = () => void;

function createAuthRuntime() {
  let unsubscribe: Cleanup | null = (globalThis as any).__AUTH_UNSUB__ ?? null;
  
  // Get the store's setState method
  const getState = () => useAuthStore.getState();
  const setState = (state: Partial<ReturnType<typeof getState>>) => useAuthStore.setState(state);

  async function bootstrap() {
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
          setState({ 
            user: reactUser,
            profile: userWithProfile.profile,
            isAuthenticated: true,
            error: null
          });
        } else {
          console.log('[DEBUG] Auth bootstrap: session exists but no profile');
          setState({ 
            user: null,
            profile: null,
            isAuthenticated: false,
            error: null
          });
        }
      } else {
        console.log('[DEBUG] Auth bootstrap: no session found');
        setState({ 
          user: null,
          profile: null,
          isAuthenticated: false,
          error: null
        });
      }
    } catch (e) {
      console.log('[DEBUG] Auth bootstrap: error:', e instanceof Error ? e.message : String(e));
      setState({ 
        user: null,
        profile: null,
        isAuthenticated: false,
        error: e instanceof Error ? e.message : String(e)
      });
    } finally {
      setState({ isLoading: false });
      console.log('[DEBUG] Auth bootstrap: completed');
    }
  }

  function start() {
    if (unsubscribe) {
      console.log('[DEBUG] Auth listener: already started, skipping');
      return;
    }
    
    console.log('[AUTH] listener registered once');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Only set user/isAuthenticated, no navigation
      if (session?.user) {
        // Get full user profile on auth change
        const userWithProfile = await supabaseAuth.getCurrentUser();
        
        if (userWithProfile?.profile) {
          const reactUser = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
          setState({
            user: reactUser,
            profile: userWithProfile.profile,
            isAuthenticated: true,
            error: null
          });
        } else {
          setState({
            user: null,
            profile: null,
            isAuthenticated: false,
            error: null
          });
        }
      } else {
        setState({
          user: null,
          profile: null,
          isAuthenticated: false,
          error: null
        });
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
  }

  return { bootstrap, start, stop };
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