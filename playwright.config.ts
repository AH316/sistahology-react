import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'off',
    
    /* Capture screenshot always for UI audit */
    screenshot: 'on',
    
    /* Capture video on failure for UI audit flows */
    video: 'off',
  },

  /* Global setup for dev server */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    // Setup projects (run first)
    {
      name: 'setupAdmin',
      testMatch: /admin-setup\.spec\.ts/,
    },
    // Original projects for existing tests
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      globalSetup: './tests/global-setup.ts',
    },
    {
      name: 'authUser',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json'
      },
      globalSetup: './tests/global-setup.ts',
    },
    {
      name: 'authAdmin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setupAdmin'],
      // No globalSetup - relies on setupAdmin dependency
    },
    // UI Audit projects for different viewports
    {
      name: 'mobile-390',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
      globalSetup: './tests/global-setup.ts',
    },
    {
      name: 'tablet-768',
      use: {
        ...devices['iPad'],
        viewport: { width: 768, height: 1024 }
      },
      globalSetup: './tests/global-setup.ts',
    },
    {
      name: 'desktop-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
      globalSetup: './tests/global-setup.ts',
    },
  ],

  /* Artifact configuration */
  outputDir: 'tests/artifacts/test-results/',
  
  /* Global test configuration */
  expect: {
    /* Timeout for expect() calls */
    timeout: 10000,
  },
  
  /* Test timeout */
  timeout: 30000,
});