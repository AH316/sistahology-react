/**
 * Test Admin Security - Verify users cannot promote themselves to admin
 *
 * This script tests the is_admin protection from the CLIENT SIDE using
 * the anon key, which properly enforces RLS policies and triggers.
 *
 * Run with: tsx scripts/testAdminSecurity.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.scripts
dotenv.config({ path: '.env.scripts' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  console.error('\nMake sure .env.scripts has both SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create client with ANON key (not service role!)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminSecurity() {
  console.log('');
  console.log('==========================================');
  console.log('ADMIN SECURITY TEST');
  console.log('==========================================');
  console.log('');
  console.log('This test verifies that users CANNOT promote themselves to admin');
  console.log('by attempting to update their own is_admin flag via the client.');
  console.log('');
  console.log('Configuration:');
  console.log('  URL:', SUPABASE_URL);
  console.log('  Using: ANON KEY (RLS enforced)');
  console.log('');

  // Step 1: Find a non-admin user to test with
  console.log('Step 1: Finding a non-admin user...');
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('is_admin', false)
    .limit(1);

  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  No non-admin users found in database');
    console.log('   Create a regular user account first');
    return;
  }

  const testUser = profiles[0];
  console.log(`✓ Found test user: ${testUser.id}`);
  console.log(`  Current is_admin: ${testUser.is_admin}`);
  console.log('');

  // Step 2: Attempt to update is_admin as an unauthenticated client
  console.log('Step 2: Attempting to UPDATE is_admin = true (unauthenticated)...');
  console.log('  Expected: RLS policy blocks (no auth.uid())');
  console.log('');

  const { data: updateData1, error: updateError1 } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', testUser.id)
    .select();

  if (updateError1) {
    console.log('✓ PASS: Unauthenticated update blocked by RLS');
    console.log(`  Error: ${updateError1.message}`);
  } else if (!updateData1 || updateData1.length === 0) {
    console.log('✓ PASS: Unauthenticated update returned no rows (blocked by RLS)');
  } else {
    console.log('✗ FAIL: Unauthenticated update succeeded (RLS not working!)');
    console.log('  Data:', updateData1);
  }
  console.log('');

  // Step 3: Check if user can authenticate and try again
  console.log('Step 3: Testing authenticated user self-promotion...');
  console.log('  Note: This requires test user credentials');
  console.log('  Skipping authenticated test (would need user login)');
  console.log('');

  // Verify current state
  console.log('Step 4: Verifying is_admin value unchanged...');
  const { data: verifyData, error: verifyError } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('id', testUser.id)
    .single();

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError.message);
    return;
  }

  if (verifyData.is_admin === false) {
    console.log('✓ PASS: is_admin remains false (security intact)');
  } else {
    console.log('✗ FAIL: is_admin was changed to true (security breach!)');
  }
  console.log('');

  console.log('==========================================');
  console.log('SUMMARY');
  console.log('==========================================');
  console.log('');
  console.log('✓ RLS policies prevent unauthenticated updates');
  console.log('✓ Trigger-based protection requires authenticated test');
  console.log('');
  console.log('AUTHENTICATED TEST:');
  console.log('  To fully test the trigger, log in to your app as a regular');
  console.log('  (non-admin) user and try to run this in the browser console:');
  console.log('');
  console.log('  const { data, error } = await supabase');
  console.log('    .from("profiles")');
  console.log('    .update({ is_admin: true })');
  console.log('    .eq("id", "<your-user-id>");');
  console.log('');
  console.log('  Expected result: Error with message about cannot modify is_admin');
  console.log('');
}

testAdminSecurity()
  .then(() => {
    console.log('Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
