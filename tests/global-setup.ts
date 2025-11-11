import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  // Load environment variables from .env.test if running via npm script
  // These should already be loaded if using npx dotenv -e .env.test
  if (!process.env.E2E_EMAIL) {
    dotenv.config({ path: '.env.test' });
  }

  // Only run setup if E2E credentials are provided
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  // IMPORTANT: Must match playwright.config.ts baseURL for localStorage origin consistency
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  
  if (!email || !password) {
    console.log('Skipping authentication setup: E2E_EMAIL and E2E_PASSWORD not provided');
    console.log('Tests will run without authentication state');
    return;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Warning: Supabase credentials not found, cannot seed test data');
  }

  console.log('Setting up authentication state...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page (using HashRouter)
    await page.goto(`${baseUrl}/#/login`);

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in login credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for successful authentication and redirect
    // The app should redirect to dashboard after successful login
    await page.waitForURL(`${baseUrl}/#/dashboard`, {
      timeout: 30000,
      waitUntil: 'load' // Changed from networkidle for better compatibility
    });
    
    // Verify we're authenticated by checking for a user-specific element
    // or by waiting for the auth state to be established
    await page.waitForTimeout(2000); // Give time for auth state to stabilize
    
    // Save storage state to file
    const storageStatePath = path.join(__dirname, '.auth', 'user.json');
    await context.storageState({ path: storageStatePath });
    
    console.log('Authentication state saved successfully to:', storageStatePath);
    
    // Seed test data using Supabase client
    if (supabaseUrl && supabaseAnonKey) {
      console.log('Seeding test data...');
      
      // Create Supabase client and authenticate
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Sign in with the same credentials to get session
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError || !authData.user) {
        console.error('Failed to authenticate with Supabase:', authError);
      } else {
        // Check if user has any journals
        const { data: journals, error: journalsError } = await supabase
          .from('journal')
          .select('*')
          .eq('user_id', authData.user.id);
        
        if (journalsError) {
          console.error('Failed to fetch journals:', journalsError);
        } else if (!journals || journals.length === 0) {
          // Create a test journal if none exists
          const { data: newJournal, error: createError } = await supabase
            .from('journal')
            .insert({
              journal_name: 'E2E Test Journal',
              color: '#f472b6',
              user_id: authData.user.id
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Failed to create test journal:', createError);
          } else {
            console.log('Created test journal:', newJournal.journal_name);
          }
        } else {
          console.log(`User has ${journals.length} existing journal(s)`);
        }
      }
    }
    
  } catch (error) {
    console.error('Failed to set up authentication:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;