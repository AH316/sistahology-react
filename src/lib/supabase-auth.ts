import { supabase } from './supabase'
import type { 
  Profile, 
  SupabaseUserWithProfile 
} from '../types/supabase'
import type { LoginCredentials, RegisterData, ApiResponse } from '../types'

// Authentication functions
export const supabaseAuth = {
  // Sign up new user
  async signUp(data: RegisterData): Promise<ApiResponse<SupabaseUserWithProfile>> {
    try {
      // Validate input
      if (!data.name || !data.email || !data.password) {
        throw new Error('All fields are required');
      }

      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: {
            name: data.name.trim(),
            theme: 'pink'
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User registration failed');
      }

      // Try to create or get existing profile with proper error handling
      let profile: Profile;
      
      try {
        // First, try to get existing profile (might exist from database trigger)
        const existingProfile = await getUserProfile(authData.user.id);
        
        if (existingProfile) {
          console.log('Profile already exists for user:', authData.user.id);
          profile = existingProfile;
        } else {
          // Create new profile if it doesn't exist
          const profileData = {
            id: authData.user.id,
            name: data.name.trim(),
            journal_id: null // Will be updated after creating default journal
          };

          const { data: createdProfile, error: profileError } = await supabase
            .from('profiles')
            .insert([profileData])
            .select()
            .single();

          if (profileError) {
            // This is a critical error - we can't proceed without a profile
            console.error('Critical: Failed to create user profile:', profileError.message);
            
            // Clean up the auth user since profile creation failed
            await supabase.auth.admin.deleteUser(authData.user.id).catch(console.warn);
            
            throw new Error('Failed to create user profile. Registration cannot complete.');
          }
          
          profile = createdProfile;
        }
        
        // Create default journal and update profile
        const journalId = await createDefaultJournal(authData.user.id);
        
        // Update profile with journal_id if journal was created successfully
        if (journalId && profile.journal_id !== journalId) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ journal_id: journalId })
            .eq('id', authData.user.id)
            .select()
            .single();
            
          if (updateError) {
            console.warn('Failed to update profile with journal_id:', updateError.message);
            // Use the profile as-is, journal_id will remain null
          } else {
            profile = updatedProfile;
          }
        }

        const userWithProfile: SupabaseUserWithProfile = {
          ...authData.user,
          profile
        };

        return { success: true, data: userWithProfile };
        
      } catch (profileSetupError) {
        // If profile setup fails, we need to clean up the auth user
        console.error('Profile setup failed during registration:', profileSetupError);
        
        try {
          await supabase.auth.signOut(); // Clean up the session
        } catch (signOutError) {
          console.warn('Failed to clean up session after profile error:', signOutError);
        }
        
        throw profileSetupError;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  },

  // Sign in existing user
  async signIn(credentials: LoginCredentials): Promise<ApiResponse<SupabaseUserWithProfile>> {
    try {
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Get user profile with validation
      let profile = await getUserProfile(authData.user.id);
      
      // If profile doesn't exist, create it (handles legacy users)
      if (!profile) {
        console.log('Profile not found, creating default profile for user:', authData.user.id);
        profile = await createUserProfile(authData.user.id, authData.user.user_metadata?.name || 'User');
        
        if (!profile) {
          throw new Error('Failed to create user profile. Please contact support.');
        }
      }

      const userWithProfile: SupabaseUserWithProfile = {
        ...authData.user,
        profile
      };

      return { success: true, data: userWithProfile };

    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  },

  // Sign out
  async signOut(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      return { success: false, error: errorMessage };
    }
  },

  // Get current session
  async getCurrentUser(): Promise<SupabaseUserWithProfile | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // Get user profile with validation
      let profile = await getUserProfile(user.id);
      
      // If profile doesn't exist, create it (handles legacy users or auth trigger failures)
      if (!profile) {
        console.log('Profile not found for current user, creating default profile:', user.id);
        profile = await createUserProfile(user.id, user.user_metadata?.name || 'User');
        
        if (!profile) {
          console.error('Failed to create profile for current user');
          return null;
        }
      }

      return {
        ...user,
        profile
      };

    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: SupabaseUserWithProfile | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Get user profile with validation
        let profile = await getUserProfile(session.user.id);
        
        // If profile doesn't exist, create it (handles auth trigger failures)
        if (!profile) {
          console.log('Profile not found in auth state change, creating default profile:', session.user.id);
          profile = await createUserProfile(session.user.id, session.user.user_metadata?.name || 'User');
          
          if (!profile) {
            console.error('Failed to create profile in auth state change');
            callback(null);
            return;
          }
        }
        
        const userWithProfile: SupabaseUserWithProfile = {
          ...session.user,
          profile
        };
        callback(userWithProfile);
      } else {
        callback(null);
      }
    });
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  }
};

// Helper functions
async function getUserProfile(userId: string): Promise<Profile | undefined> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Profile fetch error:', error.message);
      return undefined;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return undefined;
  }
}

// Create user profile with default journal
async function createUserProfile(userId: string, name: string): Promise<Profile | undefined> {
  try {
    // First create the profile
    const profileData = {
      id: userId,
      name: name.trim(),
      journal_id: null // Will be updated after creating journal
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      return undefined;
    }

    // Create default journal
    const journalId = await createDefaultJournal(userId);
    
    // Update profile with journal_id
    const updatedProfile = {
      ...profileData,
      journal_id: journalId
    };

    // Update the profile with the journal_id
    if (journalId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ journal_id: journalId })
        .eq('id', userId);

      if (updateError) {
        console.warn('Error updating profile with journal_id:', updateError.message);
      }
    }

    return updatedProfile;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return undefined;
  }
}

async function createDefaultJournal(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('journal')
      .insert([{
        user_id: userId,
        journal_name: 'My Journal',
        color: '#F5C3E2' // Default color from schema
      }])
      .select()
      .single();

    if (error) {
      console.warn('Default journal creation error:', error.message);
      return null;
    }

    // Update profile with the default journal_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ journal_id: data.id })
      .eq('id', userId);

    if (profileError) {
      console.warn('Profile update error:', profileError.message);
    }

    return data.id;
  } catch (error) {
    console.error('Error creating default journal:', error);
    return null;
  }
}