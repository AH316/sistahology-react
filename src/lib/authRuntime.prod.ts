import { supabase } from './supabase';
import { useAuthStore } from '../stores/authStore';
import { supabaseAuth } from './supabase-auth';
import { convertSupabaseToReact } from '../types/supabase';

let unsub: (() => void) | null = null;

export async function initAuthProd() {
  const set = useAuthStore.setState;

  // One-time bootstrap
  set({ isLoading: true });
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session?.user) {
      // Get full user profile for authenticated session
      const userWithProfile = await supabaseAuth.getCurrentUser();
      
      if (userWithProfile?.profile) {
        const user = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
        set({ 
          user, 
          profile: userWithProfile.profile,
          isAuthenticated: true, 
          error: null 
        });
      } else {
        set({ 
          user: null,
          profile: null,
          isAuthenticated: false, 
          error: null 
        });
      }
    } else {
      set({ 
        user: null,
        profile: null,
        isAuthenticated: false, 
        error: null 
      });
    }
  } catch (e) {
    set({ 
      user: null,
      profile: null,
      isAuthenticated: false,
      error: e instanceof Error ? e.message : String(e) 
    });
  } finally {
    set({ isLoading: false });
  }

  // Single listener (no HMR logic here)
  if (!unsub) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Get full user profile on auth change
        const userWithProfile = await supabaseAuth.getCurrentUser();
        
        if (userWithProfile?.profile) {
          const user = convertSupabaseToReact.profile(userWithProfile.profile, userWithProfile);
          set({ 
            user, 
            profile: userWithProfile.profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          set({ 
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      } else {
        set({ 
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    });
    unsub = () => subscription?.unsubscribe();
  }
}