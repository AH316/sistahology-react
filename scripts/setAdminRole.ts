#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';

// Load environment from .env.scripts only
dotenv.config({ path: resolve(process.cwd(), '.env.scripts') });

async function setAdminRole(email: string): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.scripts');
    process.exit(1);
  }

  if (!email) {
    console.error('Error: Email is required');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  try {
    // Find user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${email}`,
      page: 1,
      perPage: 1,
    });

    if (listError) {
      console.error('Error listing users:', listError.message);
      process.exit(1);
    }

    if (!users || users.users.length === 0) {
      console.error(`Error: User with email "${email}" not found`);
      process.exit(1);
    }

    const user = users.users[0];
    const userId = user.id;

    // Merge with existing app_metadata
    const existingMetadata = user.app_metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      role: 'admin',
    };

    // Update user with admin role
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: updatedMetadata,
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError.message);
      process.exit(1);
    }

    // Log only user id and new role
    console.log(`User ID: ${userId}`);
    console.log(`app_metadata.role: ${updatedUser.user?.app_metadata?.role}`);
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs(): string {
  const emailFlagIndex = process.argv.indexOf('--email');
  if (emailFlagIndex === -1 || emailFlagIndex === process.argv.length - 1) {
    console.error('Error: --email flag is required');
    console.error('Usage: npm run set:admin -- --email user@example.com');
    process.exit(1);
  }
  return process.argv[emailFlagIndex + 1];
}

// Main execution
const email = parseArgs();
setAdminRole(email).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});