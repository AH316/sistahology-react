# QA Runbook

## Playwright E2E Testing Guide

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure development server is running or will be started by Playwright:
```bash
npm run dev
```

### Running Tests

#### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/journal-new.spec.ts

# Run tests with specific project (authenticated)
npx playwright test --project=authUser

# Run tests with specific project (unauthenticated)
npx playwright test --project=chromium
```

### Authenticated Tests (storageState)

The test suite uses Playwright's storageState feature to handle authenticated tests efficiently. This approach:
- Logs in once during global setup
- Saves authentication state to a file
- Reuses the authentication state for all authenticated tests

#### Setup Requirements

1. **Environment Variables**

Create a `.env.test.local` file or set these environment variables:

```bash
E2E_EMAIL=your-test-user@example.com
E2E_PASSWORD=your-test-password
```

**Note**: These credentials must be for a real user account in your Supabase instance that:
- Has verified email
- Has at least one journal created
- Has appropriate permissions

2. **Authentication Flow**

The authentication setup (`tests/global-setup.ts`) performs these steps:
1. Launches a Chromium browser
2. Navigates to `/login` page
3. Fills in email and password from environment variables
4. Submits the login form
5. Waits for redirect to home page (successful authentication)
6. Saves browser storage state to `tests/.auth/user.json`

#### Project Configuration

The `playwright.config.ts` defines two test projects:

1. **chromium** (default)
   - For unauthenticated tests
   - No storage state
   - Tests public pages, login flow, etc.

2. **authUser**
   - For authenticated tests
   - Uses `storageState: 'tests/.auth/user.json'`
   - Tests protected routes like dashboard, journal creation, etc.

#### Writing Authenticated Tests

To write tests that require authentication:

```typescript
import { test, expect } from '@playwright/test';

// Option 1: Configure entire test file to use auth state
test.use({ storageState: 'tests/.auth/user.json' });

test('authenticated test', async ({ page }) => {
  // User is already logged in
  await page.goto('/dashboard');
  // ... test logic
});

// Option 2: Use the authUser project in your test command
// npx playwright test --project=authUser your-test.spec.ts
```

#### Test Selectors

The journal entry tests use the following data-testid selectors:
- `journal-editor` - The main text editor for journal entries
- `save-entry` - The save button for journal entries
- `journal-select` - The dropdown for selecting journals
- `toast-root` - The toast notification container

These selectors provide stable references for test automation and should be added to the corresponding React components.

### Troubleshooting

#### Authentication Setup Fails

If the global setup fails:

1. Check environment variables are set correctly:
```bash
echo $E2E_EMAIL
echo $E2E_PASSWORD
```

2. Verify the dev server is running:
```bash
npm run dev
```

3. Manually test the login flow in a browser

4. Run setup with headed mode for debugging:
```typescript
// In tests/global-setup.ts, change:
const browser = await chromium.launch({ headless: false });
```

#### Tests Skip Authentication

If tests are skipping authentication:
- Ensure `E2E_EMAIL` and `E2E_PASSWORD` are set
- Check that `tests/.auth/user.json` exists after setup
- Verify the storageState path in test configuration

#### Storage State Issues

To clear and regenerate storage state:
```bash
rm -rf tests/.auth/user.json
npx playwright test --project=authUser
```

### Best Practices

1. **Use Data Test IDs**: Add `data-testid` attributes to critical UI elements for stable test selectors

2. **Isolate Test Data**: Use a dedicated test account that won't interfere with production or development data

3. **Handle Async Operations**: Always wait for network requests and UI updates:
```typescript
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();
```

4. **Clean Test State**: Tests should be independent and not rely on state from other tests

5. **Monitor Console Errors**: The test setup monitors console errors to catch unexpected issues

### CI/CD Integration

For CI environments:

1. Set environment variables in CI secrets:
```yaml
env:
  E2E_EMAIL: ${{ secrets.E2E_EMAIL }}
  E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

2. The config automatically handles CI mode:
- Retries failed tests
- Runs tests sequentially
- Fails on `test.only`

### Artifacts and Reports

Test artifacts are stored in:
- `test/artifacts/test-results/` - Test results and failure screenshots
- `test/artifacts/screens/` - Screenshots from tests
- `tests/.auth/` - Authentication state (git-ignored)

### Security Considerations

1. **Never commit credentials**: The `.auth` directory should be in `.gitignore`
2. **Use test accounts**: Don't use production user accounts for testing
3. **Rotate credentials**: Regularly update test account passwords
4. **Limit permissions**: Test accounts should have minimal required permissions