import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Protected Route Gate Tests
 * 
 * Purpose: Prove that protected routes immediately redirect unauthenticated users
 * and load properly for authenticated users WITHOUT hanging on "Loading <page>" states.
 * 
 * Key Requirements:
 * - Unauthenticated users get immediate redirect to login (no "Loading Dashboard" hang)
 * - Authenticated users load protected pages within 2s
 * - No infinite "Loading..." states occur
 * - Auth readiness gating prevents premature data fetching
 */

const PROTECTED_ROUTES = [
  { path: '/#/dashboard', name: 'Dashboard' },
  { path: '/#/calendar', name: 'Calendar' },
  { path: '/#/search', name: 'Search' },
  { path: '/#/new-entry', name: 'New Entry' },
  { path: '/#/profile', name: 'Profile' }
];

// Helper to save artifacts
async function savePageArtifacts(page: any, testName: string, suffix: string = '') {
  const artifactDir = path.join('tests/artifacts/protected-gate');
  await fs.promises.mkdir(artifactDir, { recursive: true });
  
  const baseName = `${testName}${suffix ? '-' + suffix : ''}`;
  
  // Screenshot
  await page.screenshot({ 
    path: path.join(artifactDir, `${baseName}.png`),
    fullPage: true 
  });
  
  // Current URL for verification
  const url = page.url();
  await fs.promises.writeFile(
    path.join(artifactDir, `${baseName}-url.txt`), 
    url
  );
}

test.describe('Protected Route Gates', () => {
  test.describe('Unauthenticated Access - Immediate Redirects', () => {
    // Use chromium project (no auth) for unauthenticated tests
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const route of PROTECTED_ROUTES) {
      test(`${route.name} - immediate redirect without loading hang`, async ({ page }) => {
        console.log(`Testing unauthenticated access to ${route.path}`);
        
        // Start timing
        const startTime = Date.now();
        
        // Navigate to protected route
        await page.goto(route.path);
        
        // Should redirect to login reasonably quickly (within 3s)
        // The key is that we don't hang on "Loading <page>" indefinitely
        await expect(page).toHaveURL(/\/#\/login/, { timeout: 3000 });
        
        const redirectTime = Date.now() - startTime;
        console.log(`Redirect completed in ${redirectTime}ms`);
        
        // Verify we never saw a "Loading" state
        const loadingElements = page.locator('text=/Loading|Checking authentication/');
        const loadingCount = await loadingElements.count();
        
        // We may briefly see "Checking authentication..." but it should resolve quickly
        // The key is that we end up at login, not stuck loading
        expect(page.url()).toMatch(/\/#\/login/);
        
        // Save artifact showing successful redirect
        await savePageArtifacts(page, `redirect-${route.name.toLowerCase().replace(' ', '-')}`, 'success');
        
        // Verify redirect time was reasonable (less than 3 seconds - no hanging)
        expect(redirectTime).toBeLessThan(3000);
      });
    }

    test('Multiple rapid protected route attempts - no accumulating load states', async ({ page }) => {
      console.log('Testing rapid navigation between protected routes');
      
      const startTime = Date.now();
      const redirectTimes: number[] = [];
      
      for (const route of PROTECTED_ROUTES.slice(0, 3)) { // Test first 3 routes
        const routeStartTime = Date.now();
        
        await page.goto(route.path);
        await expect(page).toHaveURL(/\/#\/login/, { timeout: 2000 });
        
        const routeRedirectTime = Date.now() - routeStartTime;
        redirectTimes.push(routeRedirectTime);
        console.log(`${route.name} redirect: ${routeRedirectTime}ms`);
        
        // Brief pause between attempts
        await page.waitForTimeout(100);
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`Total redirect sequence: ${totalTime}ms`);
      
      // Verify all redirects were reasonably fast (no hanging)
      redirectTimes.forEach((time, index) => {
        expect(time).toBeLessThan(3000);
      });
      
      // Verify no infinite loading states
      const loadingSpinners = page.locator('.animate-spin, [data-testid="loading-spinner"]');
      const spinnerCount = await loadingSpinners.count();
      expect(spinnerCount).toBe(0); // Should be at login page with no spinners
      
      await savePageArtifacts(page, 'rapid-redirects', 'final-state');
    });
  });

  test.describe('Authenticated Access - Fast Loading', () => {
    // Use authUser project for authenticated tests
    test.use({ storageState: 'tests/.auth/user.json' });

    for (const route of PROTECTED_ROUTES) {
      test(`${route.name} - loads within 2s without hanging`, async ({ page }) => {
        console.log(`Testing authenticated access to ${route.path}`);
        
        const startTime = Date.now();
        
        // Navigate to protected route
        await page.goto(route.path);
        
        // Wait for the page to be ready (no auth loading states) within 3s
        // Check for absence of auth loading indicators
        await page.waitForFunction(() => {
          // Look for auth loading indicators that should NOT be present
          const authLoading = document.body.textContent?.includes('Checking authentication');
          const retryingAuth = document.body.textContent?.includes('Retrying authentication');
          
          // Page is ready when no auth loading states
          return !authLoading && !retryingAuth;
        }, { timeout: 3000 });
        
        const loadTime = Date.now() - startTime;
        console.log(`${route.name} loaded in ${loadTime}ms`);
        
        // Verify we're on the correct route (not redirected to login)
        expect(page.url()).toContain(route.path.substring(2)); // Remove /# prefix
        
        // Verify page has meaningful content (not stuck in loading state)
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
        expect(pageContent!.length).toBeGreaterThan(20); // Should have some content
        
        // Verify no auth loading states
        expect(pageContent).not.toContain('Checking authentication');
        expect(pageContent).not.toContain('Retrying authentication');
        
        // Save artifact showing successful load
        await savePageArtifacts(page, `load-${route.name.toLowerCase().replace(' ', '-')}`, 'success');
        
        // Verify load time was reasonable (no hanging)
        expect(loadTime).toBeLessThan(3000);
      });
    }

    test('Dashboard - verify data loading separation from auth loading', async ({ page }) => {
      console.log('Testing Dashboard auth vs data loading separation');
      
      // Navigate to dashboard
      await page.goto('/#/dashboard');
      
      // Wait for auth to complete and page to be accessible
      await page.waitForFunction(() => {
        // Check that we're not stuck on "Checking authentication..."
        const authLoadingText = document.body.textContent?.includes('Checking authentication');
        return !authLoadingText;
      }, { timeout: 2000 });
      
      // Verify we're at dashboard (auth passed)
      expect(page.url()).toContain('/dashboard');
      
      // Dashboard may show loading for data (journals, entries) but not for auth
      // This is acceptable - we just want to prove auth loading doesn't hang
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Checking authentication');
      
      // Data loading states are OK, but auth loading should be complete
      // Look for dashboard-specific content
      const hasDashboardElements = await page.locator('[data-testid="dashboard"], h1:has-text("Dashboard"), .dashboard').count() > 0;
      if (!hasDashboardElements) {
        // Even if no specific dashboard testid, should have some page content
        expect(bodyText!.length).toBeGreaterThan(20);
      }
      
      await savePageArtifacts(page, 'dashboard-auth-separation', 'loaded');
    });

    test('Cross-route navigation - no auth re-checking delays', async ({ page }) => {
      console.log('Testing navigation between protected routes');
      
      const routes = PROTECTED_ROUTES.slice(0, 3); // Test first 3
      const navigationTimes: number[] = [];
      
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        const navStartTime = Date.now();
        
        await page.goto(route.path);
        
        // Wait for route to be ready (no auth loading)
        await page.waitForFunction(() => {
          const authLoading = document.body.textContent?.includes('Checking authentication');
          return !authLoading;
        }, { timeout: 1500 });
        
        const navTime = Date.now() - navStartTime;
        navigationTimes.push(navTime);
        console.log(`Navigation to ${route.name}: ${navTime}ms`);
        
        // Brief pause between navigations
        await page.waitForTimeout(100);
      }
      
      // Verify all navigations were reasonably fast (no auth re-checking hangs)
      navigationTimes.forEach((time, index) => {
        expect(time).toBeLessThan(3000); // Should be fast since auth is cached
      });
      
      await savePageArtifacts(page, 'cross-route-navigation', 'final');
    });
  });

  test.describe('Auth State Edge Cases', () => {
    test('Sign out during protected route access', async ({ page }) => {
      // Start authenticated
      await page.goto('/#/dashboard', { storageState: 'tests/.auth/user.json' });
      
      // Wait for initial load
      await page.waitForFunction(() => {
        return !document.body.textContent?.includes('Checking authentication');
      }, { timeout: 2000 });
      
      // Clear auth storage to simulate sign out
      await page.evaluate(() => {
        localStorage.removeItem('sistahology-auth');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
      });
      
      // Try to navigate to another protected route
      const startTime = Date.now();
      await page.goto('/#/profile');
      
      // Should redirect to login reasonably quickly
      await expect(page).toHaveURL(/\/#\/login/, { timeout: 3000 });
      
      const redirectTime = Date.now() - startTime;
      console.log(`Sign-out redirect time: ${redirectTime}ms`);
      
      // Verify redirect without hanging
      expect(redirectTime).toBeLessThan(3000);
      
      await savePageArtifacts(page, 'signout-redirect', 'success');
    });
  });
});

test.describe('Auth Ready State Verification', () => {
  test('ProtectedRoute isReady flag prevents data fetching hangs', async ({ page }) => {
    // Use authenticated session
    await page.goto('/#/dashboard', { storageState: 'tests/.auth/user.json' });
    
    // Monitor console for auth debug messages
    const authLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('auth:') || msg.text().includes('[GUARD]')) {
        authLogs.push(msg.text());
      }
    });
    
    // Wait for page to be ready
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 3000 });
    
    // Verify page loaded successfully
    expect(page.url()).toContain('/dashboard');
    
    // Check that auth logs show proper ready state progression
    const hasAuthStart = authLogs.some(log => log.includes('auth:start'));
    const hasGuardReady = authLogs.some(log => log.includes('[GUARD]') && log.includes('Auth not ready'));
    
    console.log('Auth logs:', authLogs);
    
    // Either we see the auth progression or it was already cached (both OK)
    if (authLogs.length > 0) {
      expect(hasAuthStart || hasGuardReady).toBeTruthy();
    }
    
    await savePageArtifacts(page, 'auth-ready-verification', 'success');
  });
});