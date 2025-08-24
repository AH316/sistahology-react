import { Page } from '@playwright/test';

// DEPRECATED: Mock authentication helpers are disabled.
// Tests now use real Supabase authentication via storageState.
// These functions are kept for reference only.

/*
export async function mockAuthenticatedUser(page: Page) {
  // Mock all Supabase auth endpoints
  await page.route('**/auth/v1/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          role: 'authenticated',
          aud: 'authenticated',
          user_metadata: {},
          app_metadata: {},
          created_at: new Date().toISOString()
        }
      })
    });
  });

  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'authenticated',
        aud: 'authenticated',
        user_metadata: {},
        app_metadata: {},
        created_at: new Date().toISOString()
      })
    });
  });

  await page.route('**/rest/v1/profile**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@example.com',
          bio: 'Test bio',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/rest/v1/journal**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'journal-1',
            journal_name: 'My Personal Journal',
            color: '#f472b6',
            user_id: 'test-user-123',
            created_at: new Date().toISOString()
          },
          {
            id: 'journal-2', 
            journal_name: 'Dream Journal',
            color: '#a78bfa',
            user_id: 'test-user-123',
            created_at: new Date().toISOString()
          }
        ])
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/rest/v1/entry**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else if (route.request().method() === 'POST') {
      const postData = await route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'entry-' + Date.now(),
          ...postData,
          created_at: new Date().toISOString()
        })
      });
    } else {
      await route.continue();
    }
  });
}
*/

/*
export async function mockUnauthenticatedUser(page: Page) {
  await page.route('**/auth/v1/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: null,
        user: null
      })
    });
  });

  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Unauthorized',
        error: 'unauthorized'
      })
    });
  });
}
*/