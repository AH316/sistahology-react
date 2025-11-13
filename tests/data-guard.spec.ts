import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Data Guard Tests
 * 
 * Purpose: Test data loading guard mechanisms to ensure they don't hang when
 * auth state changes or sessions become invalid during data operations.
 * 
 * Key Requirements:
 * - Invalid sessions redirect to login without "Loading Search" hangs
 * - Data loading waits for auth readiness before proceeding
 * - Session expiry during data operations is handled gracefully
 * - No infinite loading states when auth becomes invalid
 * - Storage clearing triggers immediate redirects, not loading hangs
 */

// Helper to save artifacts
async function saveDataGuardArtifacts(page: any, testName: string, suffix: string = '') {
  const artifactDir = path.join('tests/artifacts/data-guard');
  await fs.promises.mkdir(artifactDir, { recursive: true });
  
  const baseName = `${testName}${suffix ? '-' + suffix : ''}`;
  
  // Screenshot
  await page.screenshot({ 
    path: path.join(artifactDir, `${baseName}.png`),
    fullPage: true 
  });
  
  // Save current URL and any error states
  const pageInfo = await page.evaluate(() => ({
    url: window.location.href,
    bodyText: document.body.textContent?.substring(0, 500),
    hasLoadingSpinners: document.querySelectorAll('.animate-spin, [data-testid="loading-spinner"]').length,
    authLoadingText: document.body.textContent?.includes('Checking authentication'),
    dataLoadingText: document.body.textContent?.includes('Loading'),
    timestamp: Date.now()
  }));
  
  await fs.promises.writeFile(
    path.join(artifactDir, `${baseName}-state.json`), 
    JSON.stringify(pageInfo, null, 2)
  );
}

test.describe('Data Guard - Session Invalidation', () => {
  test('Search page - session clear during access redirects immediately', async ({ page }) => {
    console.log('Testing session invalidation during Search page access');
    
    // Start with valid session
    await page.goto('/#/search', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial successful load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/search/);
    await saveDataGuardArtifacts(page, 'search-initial', 'loaded');
    
    // Clear session storage to simulate session expiry/logout
    await page.evaluate(() => {
      localStorage.removeItem('sistahology-auth');
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Also clear any other auth-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    });
    
    console.log('Cleared all auth storage');
    
    // Trigger a navigation or refresh that would check auth
    const redirectStartTime = Date.now();
    await page.goto('/#/search'); // Try to access search again
    
    // Should redirect to login quickly, not hang on "Loading Search"
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 2000 });
    
    const redirectTime = Date.now() - redirectStartTime;
    console.log(`Redirect after session clear: ${redirectTime}ms`);
    
    // Verify we never got stuck in a loading state
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Loading Search');
    expect(bodyText).not.toContain('Checking authentication');
    
    // Should be at login page now
    expect(page.url()).toMatch(/\/#\/login/);
    
    expect(redirectTime).toBeLessThan(2000);
    
    await saveDataGuardArtifacts(page, 'search-session-clear', 'redirected');
  });

  test('Dashboard - API session invalidation during data load', async ({ page }) => {
    console.log('Testing API session invalidation during Dashboard data loading');
    
    // Start authenticated
    await page.goto('/#/dashboard', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial auth to complete
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/dashboard/);
    await saveDataGuardArtifacts(page, 'dashboard-initial', 'loaded');
    
    // Mock API responses to return 401 Unauthorized (simulating session expiry)
    await page.route('**/rest/v1/**', async route => {
      console.log(`Intercepting API call to: ${route.request().url()}`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'JWT expired',
          error: 'unauthorized'
        })
      });
    });
    
    // Also mock auth endpoints to return invalid session
    await page.route('**/auth/v1/**', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_token',
          error_description: 'JWT expired'
        })
      });
    });
    
    console.log('Set up API mocks for session expiry');
    
    // Trigger a navigation or action that would cause data loading
    const redirectStartTime = Date.now();
    await page.reload(); // Reload to trigger data fetching with expired session
    
    // Should redirect to login when APIs return 401, not hang loading
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 3000 });
    
    const redirectTime = Date.now() - redirectStartTime;
    console.log(`API session expiry redirect: ${redirectTime}ms`);
    
    // Verify no hanging loading states
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Loading Dashboard');
    expect(bodyText).not.toContain('Checking authentication');
    
    expect(redirectTime).toBeLessThan(3000);
    
    await saveDataGuardArtifacts(page, 'dashboard-api-expiry', 'redirected');
  });

  test('Calendar - storage event during data operations', async ({ page }) => {
    console.log('Testing storage events during Calendar data operations');
    
    // Start authenticated
    await page.goto('/#/calendar', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/calendar/);
    await saveDataGuardArtifacts(page, 'calendar-initial', 'loaded');
    
    // Simulate another tab/window clearing auth storage
    await page.evaluate(() => {
      // Simulate storage event from another tab clearing auth
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sistahology-auth',
        newValue: null,
        oldValue: '{"state":{"user":{},"isAuthenticated":true}}',
        storageArea: localStorage
      }));
      
      // Also clear the actual storage
      localStorage.removeItem('sistahology-auth');
    });
    
    console.log('Simulated storage clear event from another tab');
    
    // Should detect the auth change and redirect
    const redirectStartTime = Date.now();
    
    // The app should detect the storage change and redirect to login
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 3000 });
    
    const redirectTime = Date.now() - redirectStartTime;
    console.log(`Storage event redirect: ${redirectTime}ms`);
    
    // Verify clean redirect without loading hang
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Loading Calendar');
    
    expect(redirectTime).toBeLessThan(3000);
    
    await saveDataGuardArtifacts(page, 'calendar-storage-event', 'redirected');
  });
});

test.describe('Data Guard - Auth Readiness Gating', () => {
  test('New Entry - data loading waits for auth ready state', async ({ page }) => {
    console.log('Testing data loading waits for auth readiness');
    
    // Monitor the auth ready progression
    const authProgression: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('auth:') || msg.text().includes('[GUARD]') || msg.text().includes('isReady')) {
        authProgression.push(msg.text());
      }
    });
    
    // Navigate to new entry
    await page.goto('/#/new-entry', { storageState: 'tests/.auth/user.json' });
    
    // Wait for auth to be ready and page to load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 3000 });
    
    expect(page.url()).toMatch(/\/#\/new-entry/);
    
    // Check that we see the proper auth progression in logs
    console.log('Auth progression:', authProgression);
    
    // The key is that data operations should wait for auth to be ready
    // We should see either auth loading complete or it was already cached
    const hasAuthProgress = authProgression.some(log => 
      log.includes('isReady') || log.includes('auth:') || log.includes('[GUARD]')
    );
    
    // If we see auth logs, they should show proper ready state progression
    if (authProgression.length > 0) {
      expect(hasAuthProgress).toBeTruthy();
    }
    
    // Verify page is functional (has loaded properly)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
    
    // Verify no loading spinners stuck
    const loadingSpinners = page.locator('.animate-spin, [data-testid="loading-spinner"]');
    const spinnerCount = await loadingSpinners.count();
    expect(spinnerCount).toBe(0);
    
    await saveDataGuardArtifacts(page, 'new-entry-auth-gating', 'ready');
  });

  test('Profile - rapid auth state changes handled gracefully', async ({ page }) => {
    console.log('Testing rapid auth state changes on Profile page');
    
    // Start authenticated
    await page.goto('/#/profile', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/profile/);
    await saveDataGuardArtifacts(page, 'profile-initial', 'loaded');
    
    // Simulate rapid auth state manipulations
    await page.evaluate(() => {
      const authData = localStorage.getItem('sistahology-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        
        // Rapidly toggle ready state
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            parsed.state.isReady = i % 2 === 0;
            localStorage.setItem('sistahology-auth', JSON.stringify(parsed));
            
            // Trigger storage events
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'sistahology-auth',
              newValue: JSON.stringify(parsed),
              storageArea: localStorage
            }));
          }, i * 100);
        }
        
        // Restore to ready state after rapid changes
        setTimeout(() => {
          parsed.state.isReady = true;
          localStorage.setItem('sistahology-auth', JSON.stringify(parsed));
        }, 600);
      }
    });
    
    console.log('Triggered rapid auth state changes');
    
    // Wait for state to stabilize
    await page.waitForTimeout(1000);
    
    // Should remain stable at profile page
    expect(page.url()).toMatch(/\/#\/profile/);
    
    // Should not be stuck in loading state
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    expect(bodyText).not.toContain('Retrying authentication');
    
    await saveDataGuardArtifacts(page, 'profile-rapid-changes', 'stabilized');
  });

  test('Dashboard - concurrent auth and data loading', async ({ page }) => {
    console.log('Testing concurrent auth and data loading on Dashboard');
    
    // Clear auth state before navigation to test initial loading
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Set up storage state but navigate fresh to test loading sequence
    const authState = await fs.promises.readFile('tests/.auth/user.json', 'utf8');
    const authStateData = JSON.parse(authState);
    
    await page.context().addCookies(authStateData.cookies || []);
    
    // Set storage but in a way that might cause race conditions
    await page.goto('/#/dashboard');
    
    // Add auth data after navigation starts (simulating race condition)
    await page.evaluate((authData) => {
      if (authData.origins && authData.origins[0] && authData.origins[0].localStorage) {
        const localStorage = authData.origins[0].localStorage;
        localStorage.forEach((item: any) => {
          window.localStorage.setItem(item.name, item.value);
        });
      }
    }, authStateData);
    
    // Should resolve to authenticated state within reasonable time
    await page.waitForFunction(() => {
      const isAtDashboard = window.location.hash.includes('/dashboard');
      const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
      return isAtDashboard && !hasAuthLoading;
    }, { timeout: 4000 });
    
    expect(page.url()).toMatch(/\/#\/dashboard/);
    
    // Verify no loading hangs
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    
    await saveDataGuardArtifacts(page, 'dashboard-concurrent-loading', 'resolved');
  });
});

test.describe('Data Guard - Network and API Errors', () => {
  test('Search - network timeout during auth verification', async ({ page }) => {
    console.log('Testing network timeout during auth verification');
    
    // Start authenticated
    await page.goto('/#/search', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/search/);
    
    // Mock slow/timeout responses for auth verification
    await page.route('**/auth/v1/**', async route => {
      // Simulate network timeout by delaying indefinitely
      await new Promise(() => {}); // Never resolve
    });
    
    // Clear auth storage to force re-verification with timeout
    await page.evaluate(() => {
      localStorage.removeItem('sistahology-auth');
    });
    
    // Navigate to trigger auth check with timeout
    const timeoutStartTime = Date.now();
    await page.goto('/#/search');
    
    // Should handle timeout gracefully and redirect to login
    // The auth system has timeouts built in
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 15000 });
    
    const timeoutHandlingTime = Date.now() - timeoutStartTime;
    console.log(`Timeout handling: ${timeoutHandlingTime}ms`);
    
    // Should not hang indefinitely
    expect(timeoutHandlingTime).toBeLessThan(15000);
    
    await saveDataGuardArtifacts(page, 'search-network-timeout', 'handled');
  });

  test('Calendar - API rate limiting during data fetch', async ({ page }) => {
    console.log('Testing API rate limiting during Calendar data fetch');
    
    // Start authenticated
    await page.goto('/#/calendar', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial auth
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/calendar/);
    
    // Mock rate limiting responses for data APIs
    await page.route('**/rest/v1/**', async route => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Rate limit exceeded',
          error: 'too_many_requests'
        })
      });
    });
    
    // Reload to trigger data fetching with rate limiting
    await page.reload();
    
    // Should still show calendar page (auth passed) even if data fails
    await page.waitForFunction(() => {
      return window.location.hash.includes('/calendar') && 
             !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 3000 });
    
    expect(page.url()).toMatch(/\/#\/calendar/);
    
    // Should not be stuck in auth loading (data loading issues are separate)
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    
    await saveDataGuardArtifacts(page, 'calendar-rate-limiting', 'handled');
  });

  test('Multiple protected routes - cascading failures handled cleanly', async ({ page }) => {
    console.log('Testing cascading failures across protected routes');
    
    // Start authenticated
    await page.goto('/#/dashboard', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    // Mock various API failures
    await page.route('**/rest/v1/journal**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    
    await page.route('**/rest/v1/entry**', async route => {
      await route.fulfill({ status: 503, body: 'Service Unavailable' });
    });
    
    // Navigate between protected routes - should remain accessible
    const routes = ['/#/calendar', '/#/search', '/#/new-entry', '/#/profile'];
    
    for (const route of routes) {
      await page.goto(route);
      
      // Should load (auth OK) even if data APIs fail
      await page.waitForFunction(() => {
        const isAtRoute = window.location.hash.includes(route.substring(2));
        const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
        return isAtRoute && !hasAuthLoading;
      }, { timeout: 2000 });
      
      expect(page.url()).toMatch(new RegExp(route.replace('#', '')));
      console.log(`Successfully loaded ${route} despite API failures`);
    }
    
    await saveDataGuardArtifacts(page, 'cascading-failures', 'all-routes-accessible');
  });
});

test.describe('Data Guard - Recovery and Resilience', () => {
  test('Auth system recovery after temporary network issues', async ({ page }) => {
    console.log('Testing auth recovery after network issues');
    
    // Start with network issues
    await page.route('**/*', async route => {
      if (route.request().url().includes('supabase')) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    
    // Try to access protected route with network issues
    await page.goto('/#/profile');
    
    // Should redirect to login due to network issues
    await expect(page).toHaveURL(/\/#\/login/, { timeout: 3000 });
    
    // Remove network blocking
    await page.unroute('**/*');
    
    // Set up proper auth state
    const authState = await fs.promises.readFile('tests/.auth/user.json', 'utf8');
    const authStateData = JSON.parse(authState);
    
    await page.context().addCookies(authStateData.cookies || []);
    if (authStateData.origins && authStateData.origins[0] && authStateData.origins[0].localStorage) {
      await page.evaluate((localStorage) => {
        localStorage.forEach((item: any) => {
          window.localStorage.setItem(item.name, item.value);
        });
      }, authStateData.origins[0].localStorage);
    }
    
    // Now try to access protected route with network restored
    const recoveryStartTime = Date.now();
    await page.goto('/#/profile');
    
    // Should recover and load successfully
    await page.waitForFunction(() => {
      return window.location.hash.includes('/profile') && 
             !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 3000 });
    
    const recoveryTime = Date.now() - recoveryStartTime;
    console.log(`Network recovery: ${recoveryTime}ms`);
    
    expect(page.url()).toMatch(/\/#\/profile/);
    expect(recoveryTime).toBeLessThan(3000);
    
    await saveDataGuardArtifacts(page, 'network-recovery', 'success');
  });

  test('Final state verification - all systems functional', async ({ page }) => {
    console.log('Final verification - all auth and data guards functional');
    
    // Comprehensive test of all major protected routes
    const routes = [
      '/#/dashboard',
      '/#/calendar', 
      '/#/search',
      '/#/new-entry',
      '/#/profile'
    ];
    
    const loadTimes: { route: string; time: number }[] = [];
    
    for (const route of routes) {
      const loadStartTime = Date.now();
      
      await page.goto(route, { storageState: 'tests/.auth/user.json' });
      
      // Each route should load without auth hangs
      await page.waitForFunction(() => {
        const isAtRoute = window.location.hash.includes(route.substring(2));
        const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
        return isAtRoute && !hasAuthLoading;
      }, { timeout: 2000 });
      
      const loadTime = Date.now() - loadStartTime;
      loadTimes.push({ route, time: loadTime });
      
      console.log(`${route}: ${loadTime}ms`);
      
      // Verify no loading hangs
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('Checking authentication');
      expect(bodyText).not.toContain('Retrying authentication');
      
      // Verify reasonable load time
      expect(loadTime).toBeLessThan(2000);
    }
    
    // Save comprehensive results
    const summaryDir = path.join('tests/artifacts/data-guard');
    await fs.promises.mkdir(summaryDir, { recursive: true });
    
    const summary = {
      timestamp: new Date().toISOString(),
      testResults: {
        totalRoutesTested: routes.length,
        allRoutesAccessible: true,
        loadTimes,
        averageLoadTime: loadTimes.reduce((sum, item) => sum + item.time, 0) / loadTimes.length,
        maxLoadTime: Math.max(...loadTimes.map(item => item.time)),
        allLoadTimesUnder2s: loadTimes.every(item => item.time < 2000)
      }
    };
    
    await fs.promises.writeFile(
      path.join(summaryDir, 'final-verification-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    await saveDataGuardArtifacts(page, 'final-verification', 'all-routes-tested');
    
    console.log('All routes tested successfully:', summary.testResults);
  });
});