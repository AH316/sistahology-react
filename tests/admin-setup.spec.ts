import { test } from '@playwright/test';
import adminSetup from './admin-setup';

/**
 * Admin Setup Test
 *
 * This test creates an authenticated admin session for E2E tests.
 * It runs the admin-setup function which:
 * 1. Authenticates with admin credentials
 * 2. Verifies admin role exists (grants if needed)
 * 3. Saves session to tests/.auth/admin.json
 */
test('setup admin authentication', async ({}, testInfo) => {
  await adminSetup(testInfo.config);
});
