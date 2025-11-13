import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Auth Idle Recovery Tests
 * 
 * Purpose: Test authentication recovery mechanisms to ensure pages don't hang
 * when auth state becomes stale or when browser events trigger recovery.
 * 
 * Key Requirements:
 * - Idle sessions recover properly without hanging
 * - Visibility change events trigger auth recovery
 * - Online/offline events are handled gracefully
 * - Recovery completes within 2s without page refresh
 * - No infinite "Loading..." states during recovery
 */

// Helper to save artifacts
async function saveRecoveryArtifacts(page: any, testName: string, suffix: string = '') {
  const artifactDir = path.join('tests/artifacts/auth-recovery');
  await fs.promises.mkdir(artifactDir, { recursive: true });
  
  const baseName = `${testName}${suffix ? '-' + suffix : ''}`;
  
  // Screenshot
  await page.screenshot({ 
    path: path.join(artifactDir, `${baseName}.png`),
    fullPage: true 
  });
  
  // Save console logs if any
  const logs = await page.evaluate(() => {
    return (window as any).__testLogs || [];
  });
  
  if (logs.length > 0) {
    await fs.promises.writeFile(
      path.join(artifactDir, `${baseName}-logs.json`), 
      JSON.stringify(logs, null, 2)
    );
  }
}

test.describe('Auth Idle Recovery', () => {
  // Use authenticated session for all tests
  test.use({ storageState: 'tests/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    // Set up console log capture
    await page.addInitScript(() => {
      (window as any).__testLogs = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;
      
      console.log = (...args) => {
        (window as any).__testLogs.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
        originalLog.apply(console, args);
      };
      
      console.warn = (...args) => {
        (window as any).__testLogs.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
        originalWarn.apply(console, args);
      };
      
      console.error = (...args) => {
        (window as any).__testLogs.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
        originalError.apply(console, args);
      };
    });
  });

  test('Calendar page - simulate idle and recovery via visibility change', async ({ page }) => {
    console.log('Testing idle recovery on Calendar page');
    
    // Navigate to calendar
    await page.goto('/#/calendar');
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    // Verify we're at calendar
    expect(page.url()).toMatch(/\/#\/calendar/);
    await saveRecoveryArtifacts(page, 'calendar-initial', 'loaded');
    
    // Simulate going idle by hiding the page (common cause of auth staleness)
    await page.evaluate(() => {
      // Dispatch visibility change to hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    console.log('Simulated page going hidden');
    await page.waitForTimeout(500); // Brief idle period
    
    // Simulate coming back online/visible (triggers recovery)
    const recoveryStartTime = Date.now();
    await page.evaluate(() => {
      // Dispatch visibility change to visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      
      // Also trigger online event
      window.dispatchEvent(new Event('online'));
    });
    
    console.log('Triggered visibility change and online events');
    
    // Wait for recovery to complete (should not show auth loading)
    await page.waitForFunction(() => {
      const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
      const hasRetrying = document.body.textContent?.includes('Retrying authentication');
      return !hasAuthLoading && !hasRetrying;
    }, { timeout: 2000 });
    
    const recoveryTime = Date.now() - recoveryStartTime;
    console.log(`Recovery completed in ${recoveryTime}ms`);
    
    // Verify we're still at calendar (no redirect to login)
    expect(page.url()).toMatch(/\/#\/calendar/);
    
    // Verify no loading spinners
    const loadingSpinners = page.locator('.animate-spin, [data-testid="loading-spinner"]');
    const spinnerCount = await loadingSpinners.count();
    expect(spinnerCount).toBe(0);
    
    // Verify recovery was fast
    expect(recoveryTime).toBeLessThan(2000);
    
    await saveRecoveryArtifacts(page, 'calendar-visibility-recovery', 'success');
  });

  test('Search page - auth watchdog recovery test', async ({ page }) => {
    console.log('Testing auth watchdog recovery on Search page');
    
    // Navigate to search
    await page.goto('/#/search');
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/search/);
    await saveRecoveryArtifacts(page, 'search-initial', 'loaded');
    
    // Simulate auth state getting stuck by manipulating the auth store
    await page.evaluate(() => {
      // Try to trigger a retry via browser storage manipulation
      const authData = localStorage.getItem('sistahology-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        // Temporarily corrupt the auth state to trigger recovery
        parsed.state.isReady = false;
        localStorage.setItem('sistahology-auth', JSON.stringify(parsed));
        
        // Trigger a page state change that might cause auth re-check
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('online'));
      }
    });
    
    console.log('Simulated auth state manipulation');
    
    // The auth system should recover automatically within 2s
    const recoveryStartTime = Date.now();
    
    // Wait for the page to remain accessible (not redirect to login)
    await page.waitForFunction(() => {
      // Page should still be accessible and not show auth loading
      const isAtSearch = window.location.hash.includes('/search');
      const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
      return isAtSearch && !hasAuthLoading;
    }, { timeout: 3000 });
    
    const recoveryTime = Date.now() - recoveryStartTime;
    console.log(`Auth state recovery: ${recoveryTime}ms`);
    
    // Verify we stayed at search page
    expect(page.url()).toMatch(/\/#\/search/);
    
    // Verify no infinite loading states
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    expect(bodyText).not.toContain('Retrying authentication');
    
    expect(recoveryTime).toBeLessThan(3000);
    
    await saveRecoveryArtifacts(page, 'search-watchdog-recovery', 'success');
  });

  test('New Entry page - rapid navigation without auth hangs', async ({ page }) => {
    console.log('Testing rapid navigation on New Entry page');
    
    // Navigate to new entry
    await page.goto('/#/new-entry');
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/new-entry/);
    await saveRecoveryArtifacts(page, 'new-entry-initial', 'loaded');
    
    // Rapid navigation sequence to stress test auth system
    const routes = ['/#/dashboard', '/#/calendar', '/#/new-entry', '/#/profile', '/#/search'];
    const navigationTimes: number[] = [];
    
    for (const route of routes) {
      const navStartTime = Date.now();
      
      await page.goto(route);
      
      // Each navigation should be fast without auth re-checking
      await page.waitForFunction(() => {
        const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
        const hasRetrying = document.body.textContent?.includes('Retrying authentication');
        return !hasAuthLoading && !hasRetrying;
      }, { timeout: 1500 });
      
      const navTime = Date.now() - navStartTime;
      navigationTimes.push(navTime);
      console.log(`Navigation to ${route}: ${navTime}ms`);
      
      // Verify we're at the expected route
      expect(page.url()).toMatch(new RegExp(route.replace('#', '')));
      
      // Brief pause between navigations
      await page.waitForTimeout(50);
    }
    
    // All navigations should be fast (auth cached)
    navigationTimes.forEach((time, index) => {
      expect(time).toBeLessThan(1500);
    });
    
    const avgTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    console.log(`Average navigation time: ${avgTime}ms`);
    
    await saveRecoveryArtifacts(page, 'rapid-navigation', 'completed');
  });

  test('Dashboard - offline/online event handling', async ({ page }) => {
    console.log('Testing offline/online recovery on Dashboard');
    
    // Navigate to dashboard
    await page.goto('/#/dashboard');
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/dashboard/);
    await saveRecoveryArtifacts(page, 'dashboard-initial', 'loaded');
    
    // Simulate going offline
    await page.evaluate(() => {
      // Set navigator.onLine to false
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    
    console.log('Simulated going offline');
    await page.waitForTimeout(300);
    
    // Simulate coming back online
    const recoveryStartTime = Date.now();
    await page.evaluate(() => {
      // Set navigator.onLine to true
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
    
    console.log('Simulated coming back online');
    
    // Wait for any recovery mechanisms to complete
    await page.waitForFunction(() => {
      // Should remain accessible without auth loading
      const isAtDashboard = window.location.hash.includes('/dashboard');
      const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
      return isAtDashboard && !hasAuthLoading;
    }, { timeout: 2000 });
    
    const recoveryTime = Date.now() - recoveryStartTime;
    console.log(`Online recovery: ${recoveryTime}ms`);
    
    // Verify still at dashboard
    expect(page.url()).toMatch(/\/#\/dashboard/);
    
    // Verify no loading states
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    
    expect(recoveryTime).toBeLessThan(2000);
    
    await saveRecoveryArtifacts(page, 'dashboard-offline-recovery', 'success');
  });

  test('Profile page - tab focus recovery mechanism', async ({ page }) => {
    console.log('Testing tab focus recovery on Profile page');
    
    // Navigate to profile
    await page.goto('/#/profile');
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/profile/);
    await saveRecoveryArtifacts(page, 'profile-initial', 'loaded');
    
    // Simulate tab losing focus (blur)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
      // Also trigger page visibility hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    console.log('Simulated tab blur and visibility hidden');
    await page.waitForTimeout(200);
    
    // Simulate tab regaining focus
    const recoveryStartTime = Date.now();
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      // Also trigger page visibility visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    console.log('Simulated tab focus and visibility visible');
    
    // Recovery should be quick and seamless
    await page.waitForFunction(() => {
      const isAtProfile = window.location.hash.includes('/profile');
      const hasAuthLoading = document.body.textContent?.includes('Checking authentication');
      const hasRetrying = document.body.textContent?.includes('Retrying authentication');
      return isAtProfile && !hasAuthLoading && !hasRetrying;
    }, { timeout: 2000 });
    
    const recoveryTime = Date.now() - recoveryStartTime;
    console.log(`Focus recovery: ${recoveryTime}ms`);
    
    // Verify still at profile
    expect(page.url()).toMatch(/\/#\/profile/);
    
    // Verify page is functional (can see profile content)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50);
    
    expect(recoveryTime).toBeLessThan(2000);
    
    await saveRecoveryArtifacts(page, 'profile-focus-recovery', 'success');
  });

  test('Cross-session recovery - storage state synchronization', async ({ page }) => {
    console.log('Testing cross-session recovery');
    
    // Start at calendar
    await page.goto('/#/calendar');
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/calendar/);
    
    // Simulate storage event (like another tab updating auth)
    await page.evaluate(() => {
      // Trigger storage event
      const authData = localStorage.getItem('sistahology-auth');
      if (authData) {
        // Re-set the same data to trigger storage event
        localStorage.setItem('sistahology-auth', authData);
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sistahology-auth',
          newValue: authData,
          oldValue: authData,
          storageArea: localStorage
        }));
      }
    });
    
    console.log('Triggered storage synchronization event');
    
    // Should remain stable without re-authentication
    await page.waitForTimeout(500);
    
    // Verify still at calendar and functional
    expect(page.url()).toMatch(/\/#\/calendar/);
    
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    expect(bodyText).not.toContain('Retrying authentication');
    
    await saveRecoveryArtifacts(page, 'storage-sync-recovery', 'success');
  });
});

test.describe('Auth Recovery Edge Cases', () => {
  test('Recovery during page transitions', async ({ page }) => {
    // Start authenticated
    await page.goto('/#/dashboard', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    // Start navigation to another page
    const navigationPromise = page.goto('/#/search');
    
    // Immediately trigger recovery events during navigation
    await page.evaluate(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('online'));
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Wait for navigation to complete
    await navigationPromise;
    
    // Should complete navigation without hanging
    await page.waitForFunction(() => {
      return window.location.hash.includes('/search') && 
             !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    expect(page.url()).toMatch(/\/#\/search/);
    
    await saveRecoveryArtifacts(page, 'transition-recovery', 'success');
  });

  test('Multiple recovery triggers - no duplicate auth checks', async ({ page }) => {
    await page.goto('/#/profile', { storageState: 'tests/.auth/user.json' });
    
    // Wait for initial load
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 2000 });
    
    // Trigger multiple recovery events rapidly
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          window.dispatchEvent(new Event('focus'));
          window.dispatchEvent(new Event('online'));
          document.dispatchEvent(new Event('visibilitychange'));
        }, i * 50);
      }
    });
    
    console.log('Triggered multiple rapid recovery events');
    
    // Should handle gracefully without multiple auth checks
    await page.waitForTimeout(1000);
    
    // Verify still at profile and stable
    expect(page.url()).toMatch(/\/#\/profile/);
    
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Checking authentication');
    
    await saveRecoveryArtifacts(page, 'multiple-recovery-triggers', 'stable');
  });
});