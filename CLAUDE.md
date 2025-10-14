# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistahology is a React + TypeScript + Vite application for a women's journaling platform. The application focuses on providing a private, beautiful journaling experience with a floral/feminine design aesthetic using pink gradients and a gerbera daisy hero background.

## Environment Setup

### Environment Files
- `.env.local` - Local development (Supabase URL + anon key)
- `.env.test` - E2E testing (includes test user credentials)  
- `.env.mcp` - MCP server configuration (database connection string for read-only access)
- `.env.scripts` - Admin scripts (Supabase URL + service role key)

Create a `.env.local` file with the following required variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For E2E testing, create `.env.test` with test user credentials:
```bash
VITE_SUPABASE_URL=your_test_supabase_url
VITE_SUPABASE_ANON_KEY=your_test_anon_key
E2E_USER_EMAIL=test_user_email
E2E_USER_PASSWORD=test_user_password
```

For MCP database access, create `.env.mcp`:
```bash
SUPABASE_DB_URL=postgresql://user:password@db.project.supabase.co:5432/postgres
```

For admin scripts, create `.env.scripts`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Development Commands

```bash
# Start development server with hot module replacement
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Run ESLint for code quality checks
npm run lint

# Preview production build locally
npm run preview

# Deploy to GitHub Pages
npm run deploy

# Run E2E tests
npm run test:e2e

# Run regression tests with @regression tag
npm run test:regression

# Run E2E tests with UI mode for debugging
npm run test:e2e:ui

# Update homepage hero snapshots
npm run snap:home

# Run journal flow tests
npm run test:journals

# Update journal creation snapshots
npm run snap:journal

# Run specific test file
npx playwright test tests/homepage-hero.spec.ts

# Run tests with specific tag
npx playwright test --grep @regression

# Run authenticated tests only
npx playwright test --project=authUser

# Debug a failing test
npx playwright test --debug tests/regression-fixes.spec.ts

# Generate accessibility reports
npx playwright test tests/accessibility.spec.ts

# Admin user management
npm run set:admin                                    # Set admin role for testadmin@example.com
tsx scripts/setAdminRole.ts --email user@example.com # Set admin role for specific user
tsx scripts/setAdminPassword.ts                      # Reset admin password
tsx scripts/quickCreateAdmin.ts                      # Create new admin user
```

## Testing Strategy

### E2E Testing with Playwright
- **Configuration**: `playwright.config.ts` with authenticated and unauthenticated projects
- **Auth setup**: `tests/global-setup.ts` creates authenticated session at `tests/.auth/user.json`
- **Test artifacts**: Screenshots and accessibility reports in `tests/artifacts/`
- **Regression tests**: Tagged with `@regression` in `tests/regression-fixes.spec.ts`

### Common Testing Patterns

**Data Test IDs**: Components use `data-testid` attributes for E2E testing:
- `hero-card`, `hero-decor` - Homepage hero elements
- `journal-select`, `journal-editor`, `save-entry` - New entry form
- `empty-journal-state` - Empty-state container when user has zero journals
- `create-first-journal` - Control to create the first journal
- `toast-root` - Toast notifications
- `login-form`, `register-form` - Authentication forms

**Auth Testing**: Tests use `tests/.auth/user.json` for authenticated sessions
**Accessibility**: Run `tests/accessibility.spec.ts` to generate axe-core reports in `tests/artifacts/accessibility/`
**Visual Regression**: Homepage snapshots stored in `tests/artifacts/screens/`

### Database Testing
- **RLS Verification**: Use `db/VERIFY_READONLY.sql` to test RLS policies without side effects
- **Security audits**: Export scripts in `db/exports/` for schema and policy analysis
- **Test in Supabase SQL Editor**: All verification scripts use BEGIN/ROLLBACK for safety

## MCP Server Configuration

For database inspection and RLS verification:
- **Server**: `supabase-db-readonly` - Read-only database access via `@claudemcp/supabase`
- **Configuration**: Uses `SUPABASE_DB_URL` from `.env.mcp` (no API keys for security)
- **Usage**: Enables direct database queries for RLS policy verification and schema inspection
- **Security**: Configured for read-only access, respects database user permissions

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.0
- **Backend**: Supabase (authentication, database, real-time subscriptions)
- **State Management**: Zustand with persistence middleware
- **Styling**: Tailwind CSS 4.1 with custom Sistahology brand colors
- **Routing**: React Router DOM 7.7
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Sanitization**: DOMPurify for HTML content
- **Testing**: Playwright for E2E, axe-core for accessibility

## Architecture Overview

### Database Schema (Supabase)
- `journal` table: User journals with metadata (user_id/owner_id column varies - scripts auto-detect)
- `entry` table: Journal entries with content and dates
- `pages` table: CMS content for static pages
- `profiles` table: User profile information
- Row Level Security (RLS) enabled with user-based access control on all tables

**Schema Notes**: The `journal` table may use either `user_id` (newer schema) or `owner_id` (legacy schema). Verification scripts like `VERIFY_READONLY.sql` automatically detect and adapt to either naming convention.

### Route Structure
**Public Routes:**
- `/` - HomePage with CMS content
- `/blog`, `/about`, `/contact`, `/news` - Content pages
- `/login`, `/register`, `/forgot-password` - Authentication pages

**Protected Routes (require authentication):**
- `/dashboard` - User dashboard with stats and recent entries
- `/calendar` - Calendar view of journal entries
- `/search` - Search across journal entries
- `/new-entry` - Create new journal entry
- `/profile` - User profile with session information and sign out
- `/entries/:id/edit` - Edit and delete existing journal entries

### Core Application Flow
1. **Authentication**: Singleton-based auth initialization in `authStore.ts`
2. **Protected routing**: `ProtectedRoute.tsx` handles auth guards with loading states
3. **Journaling**: Multi-journal support with entries, search, calendar view
4. **CMS**: Admin-editable content for home page with pink accent styling
5. **Blog**: Service-based architecture for future CMS integration

### State Management Architecture
- **AuthStore** (`stores/authStore.ts`): Zustand store with Supabase session, singleton pattern for HMR safety
- **JournalStore** (`stores/journalStore.ts`): Persisted Zustand store for journals, entries, dashboard stats
- **Local State**: React hooks for component-specific state

### Key Design Patterns

**Concurrency Control Patterns**:
- **Ref-based Guards**: Use `useRef` to prevent duplicate operations in React StrictMode
- **Journal Loading**: `journalLoadRef.current` prevents concurrent journal loads
- **Auth Initialization**: Singleton pattern prevents multiple auth listeners
- **Operation Gating**: Check operation flags before executing async operations
```typescript
const operationRef = useRef(false);
if (operationRef.current) return;
operationRef.current = true;
// ... async operation
operationRef.current = false;
```

**Toast De-duplication Pattern**:
- **Ref-based Prevention**: Use `useRef` to track toast state and prevent duplicates
- **Component-scoped**: Each component manages its own toast de-duplication
- **Reset on Success**: Clear toast flags when operation succeeds
```typescript
const toastShownRef = useRef(false);
if (!success && !toastShownRef.current) {
  showError('Error message');
  toastShownRef.current = true;
}
```

**Auth Readiness Gating**:
- **Data Fetching Guards**: Only fetch data when `isReady && user?.id` is true
- **Loading Prevention**: Protected pages check auth readiness before data operations
- **Recovery Mechanisms**: Tab visibility and online events trigger auth recovery
```typescript
if (!isReady || !user?.id) return; // Don't fetch data until auth is ready
```

**Service Layer Architecture**:
- `src/services/posts/`: Blog posts service with static provider
- `src/services/pages.ts`: CMS pages service for dynamic content
- `src/lib/supabase-database.ts`: Abstraction layer with type conversion and `ApiResponse<T>` pattern

**Authentication Flow**:
- Auth singleton prevents multiple initialization calls during HMR
- `isReady` flag with timeout protection to prevent auth spinner freezes
- `AuthRedirect` component prevents authenticated users from accessing auth pages
- Session persistence with Zustand and ref-based guards for React StrictMode
- Retry mechanism with tab visibility detection for stuck auth states

**Journal System**:
- Multi-journal support with color coding
- Complete CRUD operations: create, read, update, delete entries
- Entry creation with timezone-safe date handling (`toYYYYMMDD` utility)
- Entry editing with confirmation dialogs for destructive actions
- Search functionality across journal entries
- Calendar view for entry navigation

**Content Management**:
- CMS system for home page content via `pages` table
- Static-first loading: render content immediately while fetching DB updates in background
- Pink accent styling with `ensureHomeAccents()` function
- HTML sanitization with DOMPurify allowing specific styling classes

### Component Structure

**UI Components** (`src/components/ui/`):
- Toast system for user feedback
- Modal and confirmation dialogs
- Form inputs with error handling
- Button and Card components

**Error Boundaries**:
- `PageErrorBoundary` - Page-level errors
- `JournalErrorBoundary` - Journal-specific errors
- `FormErrorBoundary` - Form errors
- `InlineError` - Non-critical error display

### Styling System

**Tailwind Configuration**:
- Custom brand colors: `sistah-pink`, `sistah-rose`, `sistah-purple`
- Float animations for decorative elements
- Glass morphism effects with backdrop blur

**Design Language**:
- Pink gradient color palette (#FF69B4 → #FF1493)
- Gerbera daisy background for hero sections
- Floating flower decorations with CSS animations

### Development Considerations

**Routing & Deployment**:
- Uses `HashRouter` for GitHub Pages compatibility (not `BrowserRouter`)
- Base path configured as `'./'` in `vite.config.ts` for proper asset loading
- GitHub Pages deployment via `gh-pages` package with `npm run deploy`

**Date Handling**:
- Use `toYYYYMMDD()` utility for timezone-safe formatting
- Validate against future dates in journal entries
- Use `formatDate()` for display formatting

**Content Security**:
- HTML sanitization with DOMPurify
- RLS policies on all Supabase tables with comprehensive verification script
- Specific class whitelisting for pink accent styling

**Performance**:
- Zustand persistence for offline-first experience
- React Strict Mode guards for singleton initialization
- Static-first homepage loading to prevent slow text rendering
- Fixed dashboard loading race conditions
- Lazy loading for route components

**Error Handling Hierarchy**:
1. Page-level errors → `PageErrorBoundary`
2. Journal errors → `JournalErrorBoundary`
3. Form errors → `FormErrorBoundary`
4. Non-critical errors → `InlineError`
5. API errors → `ApiResponse<T>` pattern

## Database Security

### RLS Policy Coverage
- All tables have RLS enabled with complete CRUD policies
- User isolation: Users can only access their own journals/entries
- Admin boundaries: Admins can manage pages but not access private user data
- Schema adaptability: Handles both `owner_id` and `user_id` column naming

### Security Testing
Run `db/VERIFY_READONLY.sql` in Supabase SQL Editor to verify:
- RLS enablement status on all tables
- Policy effectiveness for user isolation
- Admin access boundaries
- No persistent changes (wrapped in BEGIN/ROLLBACK)

### Security Audit Artifacts

Generated security reports in `db/exports/`:
- `schema.sql` - Complete DDL with RLS policies
- `rls_report.md` - Security analysis with access matrices
- `policies_catalog.md` - Detailed inventory of all RLS policies
- `rls_status_catalog.md` - RLS enablement verification
- `schema_catalog.md` - Table and column documentation
- `audit_summary.md` - Executive security overview

## Key Files for Reference

### Core State Management
- **Auth Store**: `src/stores/authStore.ts` - Singleton pattern, HMR-safe initialization, `isReady` flag
- **Journal Store**: `src/stores/journalStore.ts` - Persisted state management with full CRUD operations

### Page Components
- **Profile Page**: `src/pages/ProfilePage.tsx` - User session info with accessible sign-out
- **Edit Entry Page**: `src/pages/EditEntryPage.tsx` - Complete entry editing with delete confirmation
- **Dashboard**: `src/pages/DashboardPage.tsx` - Fixed loading race conditions
- **HomePage**: `src/pages/HomePage.tsx` - Static-first loading optimization
- **Login Page**: `src/pages/LoginPage.tsx` - Timeout protection for stuck auth

### Testing Infrastructure
- **Test Setup**: `tests/global-setup.ts` - Auth session creation for E2E tests
- **Regression Suite**: `tests/regression-fixes.spec.ts` - Core functionality tests
- **Accessibility Tests**: `tests/accessibility.spec.ts` - WCAG AA compliance verification

### Database Security
- **RLS Verification**: `db/VERIFY_READONLY.sql` - Comprehensive non-destructive security testing
- **Schema Export**: `db/exports/schema.sql` - Complete database structure with RLS policies
- **Security Reports**: `db/exports/rls_report.md` - Access control analysis

### Services & Utilities
- **Database Abstraction**: `src/lib/supabase-database.ts` - Type-safe API layer
- **Date Utilities**: `src/utils/date.ts` - Timezone-safe date handling (`toYYYYMMDD`)
- **CMS Service**: `src/services/pages.ts` - Dynamic content management

### Configuration & Deployment
- **Vite Config**: `vite.config.ts` - HashRouter base path for GitHub Pages
- **Router**: `src/App.tsx` - HashRouter configuration for deployment

### Admin Scripts
- **Admin Role Script**: `scripts/setAdminRole.ts` - Grant admin role to users via service account
- **Admin Password**: `scripts/setAdminPassword.ts` - Reset admin user passwords  
- **Quick Admin**: `scripts/quickCreateAdmin.ts` - Create new admin users
- **Environment**: Uses `.env.scripts` with service role key for admin operations

## Troubleshooting

### Common Issues and Solutions

#### Authentication Issues

**"Checking authentication..." Spinner Freezing**
- **Symptoms**: Authentication check gets stuck indefinitely
- **Root Cause**: Race conditions in auth initialization or missing `isReady` flag
- **Solution**: 
  - Check `authStore.ts` has proper `isReady` flag implementation
  - Verify `ProtectedRoute.tsx` uses global `isReady` state
  - Use retry mechanism: refresh page or switch browser tabs
  - Check browser console for auth errors

**Login "Signing in..." Hanging Forever**
- **Symptoms**: Login button shows "Signing in..." but never completes
- **Root Cause**: Supabase auth calls timing out or network issues
- **Solution**:
  - Check network connectivity and Supabase service status
  - Verify `.env.local` has correct SUPABASE_URL and ANON_KEY
  - Clear browser cache and localStorage
  - Try different browser or incognito mode
  - Check browser console for network errors

#### Loading and Performance Issues

**Homepage Text Loading Slowly**
- **Symptoms**: Page renders but text content appears seconds later
- **Root Cause**: Blocking database calls during initial render
- **Solution**: 
  - Use static-first approach: render static content immediately
  - Fetch dynamic content in background with `useEffect`
  - Set initial loading state to `false` instead of `true`

**Dashboard Stuck on Loading**
- **Symptoms**: Dashboard shows loading spinner indefinitely
- **Root Cause**: Race conditions in journal/entry loading logic
- **Solution**:
  - Check `loadEntries()` properly sets loading state to `false`
  - Remove conditional loading checks that might prevent completion
  - Verify all async operations have proper error handling
  - Check browser console for JavaScript errors

#### Deployment and Routing Issues

**GitHub Pages Shows Blank Page**
- **Symptoms**: Deployed site loads but shows empty white page
- **Root Cause**: BrowserRouter incompatible with GitHub Pages
- **Solution**:
  - Use `HashRouter` instead of `BrowserRouter` in `App.tsx`
  - Set `base: './'` in `vite.config.ts`
  - Ensure assets are referenced relatively

**URLs Truncated on GitHub Pages**
- **Symptoms**: Site URL shows truncated project name
- **Root Cause**: GitHub Pages base path configuration
- **Solution**:
  - Use `HashRouter` for client-side routing
  - Configure proper base path in Vite config
  - Use `npm run deploy` script for consistent deployment

#### Accessibility and UI Issues

**Poor Text Contrast**
- **Symptoms**: Text difficult to read, accessibility warnings
- **Root Cause**: White text on light backgrounds or insufficient contrast ratios
- **Solution**:
  - Use dark text (`text-gray-800` or `text-gray-900`) on light backgrounds
  - Replace translucent buttons with solid backgrounds for better contrast
  - Test with browser accessibility tools
  - Aim for WCAG AA compliance (4.5:1 contrast ratio)

**Multiple H1 Elements**
- **Symptoms**: Semantic HTML validation errors
- **Root Cause**: Navigation and page content both using `<h1>` tags
- **Solution**:
  - Use only one `<h1>` per page (usually the main page title)
  - Change navigation title to `<div>` or other appropriate element

#### Race Conditions and Concurrency Issues

**Duplicate API Calls in React StrictMode**
- **Symptoms**: Multiple journal loads, duplicate toasts, concurrent operations
- **Root Cause**: React StrictMode double-mounting components causes useEffect to run twice
- **Solution**:
  - Use ref-based guards: `if (operationRef.current) return;`
  - Implement concurrency control with `journalLoadRef.current` flag
  - Add singleton patterns for auth initialization
  - Use `finally` blocks to ensure flags are cleared

**Toast Spam on Re-renders**
- **Symptoms**: Multiple error toasts appearing for the same error
- **Root Cause**: Toast showing on every component re-render without de-duplication
- **Solution**:
  - Use `toastShownRef` to track if toast already shown
  - Reset toast ref on successful operations
  - Component-scoped toast management prevents cross-component interference

**"First Journal" Flow Stuck Loading**
- **Symptoms**: Empty state shows loading spinner instead of create button
- **Root Cause**: Loading state not properly cleared after journal load completes
- **Solution**:
  - Always use `finally` blocks to clear loading states
  - Check `isLoadingJournals` conditional rendering logic
  - Verify async operations complete properly
  - Add timeout protection for stuck operations

**Protected Pages Loading Before Auth Ready**
- **Symptoms**: Pages show "Loading <page>" indefinitely or data fetching fails
- **Root Cause**: Components trying to fetch data before authentication state is determined
- **Solution**:
  - Gate all data fetching on `isReady && user?.id`
  - Add early returns in protected pages: `if (!isReady) return null;`
  - Use auth recovery mechanisms (tab visibility, online events)
  - Implement proper loading state hierarchy

### Development Best Practices

**Git Repository Issues**
- If getting "not a git repository" error, ensure you're in the correct directory
- Run `git status` to verify repository state
- Initialize git if needed: `git init`

**Environment Variables**
- Always use `.env.local` for development secrets
- Never commit `.env.local` to version control
- Use `.env.test` for E2E testing credentials
- Use `.env.scripts` for admin operations with service role key

**Testing Failures**
- Run `npm run test:regression` to verify core functionality
- Check `tests/.auth/user.json` exists for authenticated tests
- Update snapshots with `npm run snap:home` if hero layout changes
- Use `--debug` flag for interactive test debugging