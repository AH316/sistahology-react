import { supabase } from '../lib/supabase';
import type { ApiResponse } from '../types';

export interface AdminToken {
  id: string;
  token: string;
  email: string;
  created_by_user_id: string;
  used_by_user_id: string | null;
  created_at: string;
  used_at: string | null;
  expires_at: string;
  status: 'unused' | 'used' | 'expired';
}

/**
 * Create a new admin registration token
 */
export async function createAdminToken(
  email: string,
  expiresInDays: number = 7
): Promise<ApiResponse<{ token: string; registrationUrl: string }>> {
  try {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('admin_registration_tokens')
      .insert({
        token,
        email,
        created_by_user_id: authData.user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Log full error details for debugging
      console.error('Database error creating admin token:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    const registrationUrl = `${window.location.origin}/#/register?token=${token}`;

    return {
      success: true,
      data: { token, registrationUrl },
    };
  } catch (error) {
    console.error('Failed to create admin token:', error);

    // Provide helpful error messages for common issues
    let errorMessage = 'Failed to create token';

    if (error instanceof Error) {
      // Check for specific database errors
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        errorMessage = 'Database schema mismatch. Please apply migration 017.';
      } else if (error.message.includes('violates foreign key constraint')) {
        errorMessage = 'Invalid user reference. Please refresh and try again.';
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'Token already exists. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * List all admin tokens with computed status
 */
export async function listAdminTokens(): Promise<ApiResponse<AdminToken[]>> {
  try {
    const { data, error } = await supabase
      .from('admin_registration_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const tokensWithStatus: AdminToken[] = (data || []).map((token) => ({
      ...token,
      status: token.used_at
        ? 'used'
        : new Date(token.expires_at) < now
        ? 'expired'
        : 'unused',
    }));

    return { success: true, data: tokensWithStatus };
  } catch (error) {
    console.error('Failed to list admin tokens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tokens',
    };
  }
}

/**
 * Delete an admin token
 */
export async function deleteAdminToken(tokenId: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('admin_registration_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Failed to delete admin token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete token',
    };
  }
}

/**
 * Validate token and get associated email (for display, doesn't consume)
 */
export async function validateTokenForDisplay(
  token: string
): Promise<ApiResponse<{ email: string; isValid: boolean }>> {
  try {
    const { data, error } = await supabase
      .from('admin_registration_tokens')
      .select('email, used_at, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return {
        success: true,
        data: { email: '', isValid: false },
      };
    }

    const isExpired = new Date(data.expires_at) < new Date();
    const isUsed = data.used_at !== null;
    const isValid = !isExpired && !isUsed;

    return {
      success: true,
      data: { email: data.email, isValid },
    };
  } catch (error) {
    console.error('Failed to validate token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate token',
    };
  }
}

/**
 * Consume admin token during registration (called after user account is created)
 */
export async function consumeAdminToken(
  token: string,
  userId: string,
  userEmail: string
): Promise<ApiResponse<boolean>> {
  try {
    const { data, error } = await supabase.rpc('validate_and_consume_admin_token', {
      token_value: token,
      user_email: userEmail,
      user_id: userId,
    });

    if (error) throw error;

    return {
      success: true,
      data: data as boolean,
    };
  } catch (error) {
    console.error('Failed to consume admin token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to consume token',
    };
  }
}
