import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function adminSetup(config: FullConfig) {
  // Load environment variables from .env.test
  dotenv.config({ path: '.env.test' });

  const email = process.env.E2E_ADMIN_EMAIL || process.env.E2E_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_PASSWORD;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  if (!email || !password) {
    console.log('Skipping admin setup: E2E_ADMIN_EMAIL/E2E_EMAIL and password not provided');
    return;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Supabase credentials not found');
    process.exit(1);
  }

  console.log('Setting up admin authentication state...');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Sign in with admin credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      console.error('Failed to authenticate admin user:', authError);
      process.exit(1);
    }

    console.log('Admin user authenticated successfully');

    // Check if user has admin role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch profile:', profileError);
      process.exit(1);
    }

    // If not admin, attempt to grant admin role using service role key
    if (!profileData?.is_admin) {
      console.log('User is not admin. Attempting to grant admin role...');

      // Load .env.scripts for service role key
      dotenv.config({ path: '.env.scripts', override: true });
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        console.error('Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.scripts');
        console.error('Please run: npm run set:admin -- --email ' + email);
        process.exit(1);
      }

      // Create admin client with service role key
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      // Update profile to set is_admin
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Failed to grant admin role:', updateError);
        console.error('Please run: npm run set:admin -- --email ' + email);
        process.exit(1);
      }

      console.log('Admin role granted successfully');
    } else {
      console.log('User already has admin role');
    }

    // Now authenticate in browser and save session
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to login page
      await page.goto(`${baseUrl}/#/login`);
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Fill in login credentials
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for successful authentication by checking for authenticated UI elements
      // The app may redirect to home or dashboard - either is fine as long as we're authenticated
      await page.waitForSelector('button:has-text("Sign Out")', {
        timeout: 30000,
        state: 'visible'
      });

      console.log('Admin user successfully authenticated in browser');

      // Give time for auth state to stabilize
      await page.waitForTimeout(2000);

      // Save storage state to file
      const storageStatePath = path.join(__dirname, '.auth', 'admin.json');
      await context.storageState({ path: storageStatePath });

      console.log('Admin authentication state saved to:', storageStatePath);

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Failed to set up admin authentication:', error);
    throw error;
  }
}

export default adminSetup;
