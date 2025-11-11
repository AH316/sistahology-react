#!/usr/bin/env tsx
/**
 * Grant Admin Role to E2E Test User
 *
 * This script grants admin privileges to the E2E test user
 * by setting is_admin = true in the profiles table.
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';

// Load environment from .env.test for email and .env.scripts for service role
dotenv.config({ path: resolve(process.cwd(), '.env.test') });
const testEmail = process.env.E2E_ADMIN_EMAIL || process.env.E2E_EMAIL;

dotenv.config({ path: resolve(process.cwd(), '.env.scripts'), override: true });

async function grantE2EAdmin(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.scripts');
    process.exit(1);
  }

  if (!testEmail) {
    console.error('Error: E2E_ADMIN_EMAIL or E2E_EMAIL not found in .env.test');
    process.exit(1);
  }

  console.log(`Granting admin role to: ${testEmail}`);

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${testEmail}`,
      page: 1,
      perPage: 1,
    });

    if (listError) {
      console.error('Error listing users:', listError.message);
      process.exit(1);
    }

    if (!users || users.users.length === 0) {
      console.error(`Error: User with email "${testEmail}" not found`);
      console.error('Please ensure the E2E test user exists before running this script');
      process.exit(1);
    }

    const user = users.users[0];
    const userId = user.id;

    console.log(`Found user: ${userId}`);

    // Update profiles table to set is_admin = true
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating profile:', error.message);
      process.exit(1);
    }

    console.log('✓ Admin role granted successfully');
    console.log('Profile data:', data);

    // Verify admin status
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, is_admin')
      .eq('id', userId)
      .single();

    if (verifyError) {
      console.error('Error verifying admin status:', verifyError.message);
      process.exit(1);
    }

    console.log('\nVerification:');
    console.log(`  User ID: ${profile.id}`);
    console.log(`  Email: ${profile.email}`);
    console.log(`  Is Admin: ${profile.is_admin}`);

    if (profile.is_admin) {
      console.log('\n✓ Admin role verified successfully');
    } else {
      console.error('\n✗ Admin role verification failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Main execution
grantE2EAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
