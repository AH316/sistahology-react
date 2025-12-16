import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Dashboard Tab-Switch Infinite Loading Bug Tests
 *
 * PURPOSE:
 * Reproduce and verify the tab-switch infinite loading bug that occurs when:
 * 1. User logs in and navigates to dashboard (works)
 * 2. User switches to another browser tab for 5-10 seconds
 * 3. User returns to the app tab
 * 4. User navigates to dashboard → Gets stuck showing "Loading your dashboard..." infinitely
 *
 * BUG REPRODUCTION ENVIRONMENT:
 * - Happens in both dev (localhost:5173) and preview (localhost:4173) servers
 * - Affects authenticated users only
 * - Related to tab visibility events and auth state recovery
 *
 * EXPECTED BEHAVIOR:
 * - These tests should FAIL initially (demonstrating the bug exists)
 * - After fixing the bug, tests should PASS consistently
 * - Tests capture debug logs, screenshots, and traces for analysis
 *
 * DEBUG CONSOLE LOGS:
 * All dashboard interactions log with [TAB-SWITCH-DEBUG] prefix
 * These logs are captured and saved in test artifacts for analysis
 */

// Helper to save test artifacts with tab-switch context
async function saveTabSwitchArtifacts(
  page: any,
  testName: string,
  suffix: string = '',
  consoleLogs: string[] = []
) {
  const artifactDir = path.join('tests/artifacts/tab-switch');
  await fs.promises.mkdir(artifactDir, { recursive: true });

  const baseName = `${testName}${suffix ? '-' + suffix : ''}`;

  // Screenshot - full page to capture loading spinners and UI state
  await page.screenshot({
    path: path.join(artifactDir, `${baseName}.png`),
    fullPage: true
  });

  // Capture page state for analysis
  const pageState = await page.evaluate(() => ({
    url: window.location.href,
    hasLoadingText: document.body.textContent?.includes('Loading your dashboard'),
    hasWelcomeText: document.body.textContent?.includes('Welcome back'),
    hasAuthLoading: document.body.textContent?.includes('Checking authentication'),
    loadingSpinnerCount: document.querySelectorAll('.animate-spin').length,
    documentHidden: document.hidden,
    visibilityState: document.visibilityState,
    timestamp: new Date().toISOString(),
    // Capture auth state from localStorage
    authState: (() => {
      try {
        const authData = localStorage.getItem('sistahology-auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          return {
            isReady: parsed.state?.isReady,
            isAuthenticated: parsed.state?.isAuthenticated,
            hasUser: !!parsed.state?.user
          };
        }
      } catch (e) {
        return { error: 'Failed to parse auth state' };
      }
      return null;
    })()
  }));

  // Save page state
  await fs.promises.writeFile(
    path.join(artifactDir, `${baseName}-state.json`),
    JSON.stringify(pageState, null, 2)
  );

  // Save console logs with [TAB-SWITCH-DEBUG] prefix
  if (consoleLogs.length > 0) {
    const debugLogs = consoleLogs.filter(log => log.includes('[TAB-SWITCH-DEBUG]'));
    await fs.promises.writeFile(
      path.join(artifactDir, `${baseName}-console.log`),
      debugLogs.join('\n')
    );
  }

  console.log(`[TEST ARTIFACT] Saved artifacts for ${baseName}`);
  console.log(`[TEST STATE] Page state:`, pageState);
}

// Helper to simulate tab switch away
async function simulateTabSwitchAway(page: any) {
  console.log('[TEST] Simulating tab switch away (blur + visibilitychange)');

  await page.evaluate(() => {
    // Dispatch blur event
    window.dispatchEvent(new Event('blur'));

    // Set document.hidden to true
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true
    });

    // Set visibilityState to hidden
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true
    });

    // Dispatch visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    console.log('[TAB-SWITCH-DEBUG] Tab switched away (simulated)', {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      timestamp: new Date().toISOString()
    });
  });
}

// Helper to simulate tab return
async function simulateTabReturn(page: any) {
  console.log('[TEST] Simulating tab return (focus + visibilitychange)');

  await page.evaluate(() => {
    // Dispatch focus event
    window.dispatchEvent(new Event('focus'));

    // Set document.hidden to false
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true
    });

    // Set visibilityState to visible
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true
    });

    // Dispatch visibilitychange event
    document.dispatchEvent(new Event('visibilitychange'));

    console.log('[TAB-SWITCH-DEBUG] Tab returned to foreground (simulated)', {
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      timestamp: new Date().toISOString()
    });
  });
}

// Helper to wait for dashboard to finish loading (not stuck)
async function waitForDashboardLoaded(page: any, options: { timeout?: number } = {}) {
  const timeout = options.timeout || 5000;

  console.log('[TEST] Waiting for dashboard to finish loading...');

  try {
    await page.waitForFunction(() => {
      const hasLoading = document.body.textContent?.includes('Loading your dashboard');
      const hasWelcome = document.body.textContent?.includes('Welcome back');
      const hasAuthCheck = document.body.textContent?.includes('Checking authentication');

      // Dashboard is loaded when:
      // - NOT showing "Loading your dashboard"
      // - NOT showing "Checking authentication"
      // - IS showing "Welcome back" text
      return !hasLoading && !hasAuthCheck && hasWelcome;
    }, { timeout });

    console.log('[TEST] Dashboard loaded successfully');
    return true;
  } catch (error) {
    console.error('[TEST] Dashboard loading timeout - likely stuck in infinite loading');
    return false;
  }
}

test.describe('Dashboard Tab-Switch Hang Bug', () => {
  // Use authenticated session for all tests
  test.use({ storageState: 'tests/.auth/user.json' });

  let consoleLogs: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset console logs for each test
    consoleLogs = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`);
    });

    console.log('[TEST] Test started - console log capture enabled');
  });

  test('BUG REPRODUCTION - Basic tab-switch causes infinite loading', async ({ page }) => {
    console.log('[TEST] Starting basic tab-switch bug reproduction test');

    // STEP 1: Navigate to dashboard initially (should work)
    console.log('[TEST] Step 1: Initial navigation to dashboard');
    await page.goto('/#/dashboard');

    // Wait for dashboard to load successfully the first time
    const initialLoadSuccess = await waitForDashboardLoaded(page, { timeout: 10000 });
    expect(initialLoadSuccess).toBeTruthy();

    // Verify dashboard is visible
    await expect(page.locator('text=Welcome back')).toBeVisible();
    console.log('[TEST] Initial dashboard load: SUCCESS');

    await saveTabSwitchArtifacts(page, 'basic-tab-switch', 'initial-load', consoleLogs);

    // STEP 2: Simulate switching to another tab
    console.log('[TEST] Step 2: Simulating tab switch away');
    await simulateTabSwitchAway(page);

    // Wait 5 seconds in background (simulating user reading another tab)
    console.log('[TEST] Waiting 5 seconds while tab is in background...');
    await page.waitForTimeout(5000);

    await saveTabSwitchArtifacts(page, 'basic-tab-switch', 'tab-away', consoleLogs);

    // STEP 3: Return to the tab
    console.log('[TEST] Step 3: Simulating tab return');
    await simulateTabReturn(page);

    // Brief wait for visibility change handlers to process
    await page.waitForTimeout(500);

    await saveTabSwitchArtifacts(page, 'basic-tab-switch', 'tab-returned', consoleLogs);

    // STEP 4: Navigate to dashboard again (THIS IS WHERE THE BUG OCCURS)
    console.log('[TEST] Step 4: Navigating to dashboard after tab switch');
    await page.goto('/#/dashboard');

    // THIS SHOULD FAIL with current bug - dashboard will hang on "Loading your dashboard..."
    console.log('[TEST] Waiting for dashboard to load (expect FAILURE with current bug)...');
    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 5000 });

    await saveTabSwitchArtifacts(page, 'basic-tab-switch', 'final-state', consoleLogs);

    // ASSERTION - This will FAIL when bug exists, PASS when fixed
    expect(loadSuccess).toBeTruthy();

    // Verify no loading text remains
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Loading your dashboard');

    // Verify welcome text is visible
    await expect(page.locator('text=Welcome back')).toBeVisible();

    console.log('[TEST] Basic tab-switch test completed');
  });

  test('BUG CONTEXT - Multiple consecutive tab switches', async ({ page }) => {
    console.log('[TEST] Testing resilience with multiple tab switches');

    // Navigate to dashboard
    await page.goto('/#/dashboard');
    await waitForDashboardLoaded(page);
    console.log('[TEST] Initial load: SUCCESS');

    // Perform 3 consecutive tab switches
    for (let i = 1; i <= 3; i++) {
      console.log(`[TEST] Tab switch cycle ${i}/3`);

      // Switch away
      await simulateTabSwitchAway(page);
      await page.waitForTimeout(2000);

      // Switch back
      await simulateTabReturn(page);
      await page.waitForTimeout(1000);

      await saveTabSwitchArtifacts(page, 'multiple-switches', `cycle-${i}`, consoleLogs);
    }

    // Try to navigate to dashboard after multiple switches
    console.log('[TEST] Final navigation to dashboard after 3 tab switches');
    await page.goto('/#/dashboard');

    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 5000 });

    await saveTabSwitchArtifacts(page, 'multiple-switches', 'final', consoleLogs);

    // EXPECT: Dashboard should still load (should FAIL with bug)
    expect(loadSuccess).toBeTruthy();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    console.log('[TEST] Multiple tab switches test completed');
  });

  test('BUG CONTEXT - Long idle period (30 seconds) in background tab', async ({ page }) => {
    console.log('[TEST] Testing long idle period in background tab');

    // Navigate to dashboard
    await page.goto('/#/dashboard');
    await waitForDashboardLoaded(page);
    console.log('[TEST] Initial load: SUCCESS');

    await saveTabSwitchArtifacts(page, 'long-idle', 'initial', consoleLogs);

    // Switch to background
    console.log('[TEST] Switching to background for 30 seconds (simulating token expiry scenario)');
    await simulateTabSwitchAway(page);

    // Wait 30 seconds (simulates long idle that might cause token expiry)
    await page.waitForTimeout(30000);

    await saveTabSwitchArtifacts(page, 'long-idle', 'after-30s-idle', consoleLogs);

    // Return to tab
    console.log('[TEST] Returning to tab after 30s idle');
    await simulateTabReturn(page);
    await page.waitForTimeout(1000);

    // Navigate to dashboard
    console.log('[TEST] Navigating to dashboard after long idle');
    await page.goto('/#/dashboard');

    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 10000 });

    await saveTabSwitchArtifacts(page, 'long-idle', 'final', consoleLogs);

    // EXPECT: Dashboard should recover and load (may FAIL with bug)
    expect(loadSuccess).toBeTruthy();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    console.log('[TEST] Long idle test completed');
  });

  test('BUG CONTEXT - Tab switch during navigation', async ({ page }) => {
    console.log('[TEST] Testing tab switch that occurs during navigation');

    // Start at home page
    await page.goto('/#/');
    console.log('[TEST] Starting at home page');

    // Start navigation to dashboard (but don't wait)
    console.log('[TEST] Starting navigation to dashboard...');
    const navigationPromise = page.goto('/#/dashboard');

    // Immediately switch tabs mid-navigation (race condition)
    console.log('[TEST] Switching tabs MID-NAVIGATION (race condition test)');
    await page.waitForTimeout(100); // Brief delay so navigation starts
    await simulateTabSwitchAway(page);
    await page.waitForTimeout(2000);

    await saveTabSwitchArtifacts(page, 'mid-navigation', 'tab-away-during-nav', consoleLogs);

    // Return to tab
    console.log('[TEST] Returning to tab to complete navigation');
    await simulateTabReturn(page);

    // Wait for navigation to complete
    await navigationPromise;

    console.log('[TEST] Navigation completed, checking dashboard state');
    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 8000 });

    await saveTabSwitchArtifacts(page, 'mid-navigation', 'final', consoleLogs);

    // EXPECT: Dashboard should load despite mid-navigation tab switch
    expect(loadSuccess).toBeTruthy();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    console.log('[TEST] Mid-navigation tab switch test completed');
  });

  test('BUG CONTEXT - Tab switch with auth state manipulation', async ({ page }) => {
    console.log('[TEST] Testing tab switch with auth state edge cases');

    // Navigate to dashboard
    await page.goto('/#/dashboard');
    await waitForDashboardLoaded(page);
    console.log('[TEST] Initial load: SUCCESS');

    // Switch to background
    await simulateTabSwitchAway(page);

    // While in background, manipulate auth state (simulating edge case)
    console.log('[TEST] Manipulating auth state while tab is hidden');
    await page.evaluate(() => {
      const authData = localStorage.getItem('sistahology-auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          // Toggle isReady flag to simulate race condition
          console.log('[TAB-SWITCH-DEBUG] Toggling isReady flag in background', {
            beforeToggle: parsed.state?.isReady,
            timestamp: new Date().toISOString()
          });

          parsed.state.isReady = false;
          localStorage.setItem('sistahology-auth', JSON.stringify(parsed));

          // Then set it back
          setTimeout(() => {
            parsed.state.isReady = true;
            localStorage.setItem('sistahology-auth', JSON.stringify(parsed));
          }, 500);
        } catch (e) {
          console.error('[TAB-SWITCH-DEBUG] Error manipulating auth state', e);
        }
      }
    });

    await page.waitForTimeout(2000);

    await saveTabSwitchArtifacts(page, 'auth-manipulation', 'tab-away', consoleLogs);

    // Return to tab
    console.log('[TEST] Returning to tab after auth state manipulation');
    await simulateTabReturn(page);
    await page.waitForTimeout(1000);

    // Navigate to dashboard
    await page.goto('/#/dashboard');

    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 5000 });

    await saveTabSwitchArtifacts(page, 'auth-manipulation', 'final', consoleLogs);

    // EXPECT: Dashboard should handle auth state changes gracefully
    expect(loadSuccess).toBeTruthy();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    console.log('[TEST] Auth state manipulation test completed');
  });

  test('CONTROL TEST - Dashboard loads normally without tab switch', async ({ page }) => {
    console.log('[TEST] Control test - dashboard without any tab switching');

    // Navigate to dashboard without any tab switching
    await page.goto('/#/dashboard');

    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 5000 });

    await saveTabSwitchArtifacts(page, 'control-no-tab-switch', 'final', consoleLogs);

    // This should PASS even with the bug (proves the bug is tab-switch specific)
    expect(loadSuccess).toBeTruthy();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Loading your dashboard');

    console.log('[TEST] Control test passed - dashboard loads normally without tab switch');
  });

  test('RAPID RECOVERY - Quick tab switch (< 1 second)', async ({ page }) => {
    console.log('[TEST] Testing very quick tab switch (under 1 second)');

    await page.goto('/#/dashboard');
    await waitForDashboardLoaded(page);
    console.log('[TEST] Initial load: SUCCESS');

    // Very quick tab switch (< 1 second)
    await simulateTabSwitchAway(page);
    await page.waitForTimeout(500); // Only 500ms
    await simulateTabReturn(page);

    await page.waitForTimeout(500);

    // Navigate to dashboard
    await page.goto('/#/dashboard');

    const loadSuccess = await waitForDashboardLoaded(page, { timeout: 5000 });

    await saveTabSwitchArtifacts(page, 'quick-tab-switch', 'final', consoleLogs);

    // EXPECT: Quick switches should also work
    expect(loadSuccess).toBeTruthy();
    await expect(page.locator('text=Welcome back')).toBeVisible();

    console.log('[TEST] Quick tab switch test completed');
  });
});

test.describe('Dashboard Tab-Switch - Other Pages Comparison', () => {
  // Use authenticated session
  test.use({ storageState: 'tests/.auth/user.json' });

  let consoleLogs: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    });
  });

  test('COMPARISON - Calendar page tab-switch behavior', async ({ page }) => {
    console.log('[TEST] Testing if Calendar page has similar tab-switch issue');

    // Navigate to calendar
    await page.goto('/#/calendar');
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 5000 });

    console.log('[TEST] Calendar initial load: SUCCESS');

    // Tab switch
    await simulateTabSwitchAway(page);
    await page.waitForTimeout(5000);
    await simulateTabReturn(page);
    await page.waitForTimeout(500);

    // Navigate again
    await page.goto('/#/calendar');

    await page.waitForFunction(() => {
      return window.location.hash.includes('/calendar') &&
             !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 5000 });

    expect(page.url()).toMatch(/\/#\/calendar/);

    console.log('[TEST] Calendar page handles tab-switch OK');
  });

  test('COMPARISON - Search page tab-switch behavior', async ({ page }) => {
    console.log('[TEST] Testing if Search page has similar tab-switch issue');

    await page.goto('/#/search');
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 5000 });

    console.log('[TEST] Search initial load: SUCCESS');

    // Tab switch
    await simulateTabSwitchAway(page);
    await page.waitForTimeout(5000);
    await simulateTabReturn(page);
    await page.waitForTimeout(500);

    // Navigate again
    await page.goto('/#/search');

    await page.waitForFunction(() => {
      return window.location.hash.includes('/search') &&
             !document.body.textContent?.includes('Checking authentication');
    }, { timeout: 5000 });

    expect(page.url()).toMatch(/\/#\/search/);

    console.log('[TEST] Search page handles tab-switch OK');
  });
});

test.describe('Dashboard Tab-Switch - Console Log Analysis', () => {
  test.use({ storageState: 'tests/.auth/user.json' });

  test('DEBUG CAPTURE - Full console log trace of bug reproduction', async ({ page }) => {
    console.log('[TEST] Capturing complete console log trace for bug analysis');

    const allLogs: Array<{timestamp: string, type: string, message: string}> = [];

    // Capture all console activity with timestamps
    page.on('console', msg => {
      allLogs.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        message: msg.text()
      });
    });

    // Reproduce the bug
    await page.goto('/#/dashboard');
    await waitForDashboardLoaded(page);

    await simulateTabSwitchAway(page);
    await page.waitForTimeout(5000);
    await simulateTabReturn(page);
    await page.waitForTimeout(500);

    await page.goto('/#/dashboard');

    // Try to load (will likely fail)
    try {
      await waitForDashboardLoaded(page, { timeout: 5000 });
    } catch (error) {
      console.log('[TEST] Dashboard load failed (expected with bug)');
    }

    // Save comprehensive log file
    const artifactDir = path.join('tests/artifacts/tab-switch');
    await fs.promises.mkdir(artifactDir, { recursive: true });

    // Filter for debug logs
    const debugLogs = allLogs.filter(log =>
      log.message.includes('[TAB-SWITCH-DEBUG]')
    );

    await fs.promises.writeFile(
      path.join(artifactDir, 'full-debug-trace.json'),
      JSON.stringify({
        totalLogs: allLogs.length,
        debugLogs: debugLogs.length,
        logs: debugLogs,
        allLogs: allLogs
      }, null, 2)
    );

    console.log(`[TEST ARTIFACT] Saved ${debugLogs.length} debug logs to full-debug-trace.json`);
    console.log('[TEST] Console log capture completed');

    // This test is for artifact generation - no assertions
    expect(allLogs.length).toBeGreaterThan(0);
  });
});
