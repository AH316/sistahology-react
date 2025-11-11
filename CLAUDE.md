# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL REMINDER: USE SPECIALIZED AGENTS

**BEFORE starting ANY task, check if a specialized agent should handle it!**

🚫 **DON'T**: Jump directly into writing code or making changes
✅ **DO**: Consult the decision tree below and use appropriate agents

**Why?** Agents are optimized for specific tasks and produce better results with proper context and tooling.

---

## Current Status (January 2025)

**🎯 Feature Complete - Database Recovery Phase**

**🔴 CRITICAL UPDATE (Jan 4, 2025)**: Original Supabase project was deleted. Successfully recreated database from scratch in 45 minutes using existing documentation. See `DATABASE_RECOVERY.md` for full incident report.

**Current Supabase Project**: `klaspuhgafdjrrbdzlwg` (new as of Jan 4, 2025)

All essential journaling features are implemented and working:
- ✅ Core CRUD operations for entries and journals
- ✅ Trash bin with 30-day recovery window
- ✅ Bulk operations (delete and recover)
- ✅ Archive system (archive and restore)
- ✅ Multi-journal support with color-coding
- ✅ Calendar view with quick entry modal
- ✅ Full-text search with advanced filters (date range, word count, sorting)
- ✅ Responsive UI with accessibility focus
- ✅ Dashboard with stats and writing streaks
- ✅ Admin CMS for content management (pages, blog)
- ✅ Admin role-based access control with database security
- ✅ **NEW**: Entry mood tracking (optional field: happy, sad, anxious, excited, grateful, neutral)
- ✅ **NEW**: Writing prompts system (15 seed prompts, admin-managed via CMS)

**Current Focus**: Database recovery validation, E2E test recreation, stability testing.

**Last Major Updates**:
- **Database Recovery** (Jan 4, 2025): Complete database recreation from documentation
- **New Enhancements**: Mood tracking + writing prompts (migration 010)
- **Security Testing**: Comprehensive E2E security test suite with 103 tests
- **Accessibility**: Fixed WCAG 4.1.2 (aria-labels) and 1.3.1 (main landmarks)
- **Documentation**: Created DATABASE_SETUP.md, DATABASE_RECOVERY.md, security audit docs
- Enhanced search with advanced filters (date range, word count, sort options, archived toggle)
- Admin CMS implementation (AdminPagesPage, AdminBlogPage, AdminRoute guard)
- Admin security hardening (3-layer defense: column defaults, RLS policies, trigger protection)

**Documentation**:
- `DATABASE_SETUP.md` - Complete 7-step database setup guide
- `DATABASE_RECOVERY.md` - Incident report and disaster recovery runbook
- `E2E_TEST_SETUP.md` - Test user setup and two-user strategy
- `SECURITY_AUDIT_EXECUTIVE_SUMMARY.md` - Security posture overview
- `ACCESSIBILITY_COMPLIANCE_STATUS.md` - WCAG 2.1 AA compliance status
- `TODO.md` - Development backlog and completed features
- `FEATURES.md` - Complete feature inventory for users
- `TESTING.md` - Test coverage status and strategy

## Active Work & Next Steps

### 🔄 Post-Recovery Tasks

**Immediate Actions** (After Database Setup):
1. **Create E2E Test Users**: Register e2e.user@sistahology.dev and e2e.admin@sistahology.dev
2. **Grant Admin Roles**: Run `tsx scripts/setAdminRole.ts --email e2e.admin@sistahology.dev`
3. **Regenerate Auth Files**: Run `npx playwright test --project=setup` and `--project=setupAdmin`
4. **Run Test Suite**: Execute `npm run test:regression` to verify all functionality
5. **Manual Testing**: Test search features, admin CMS, mood tracking, writing prompts

**Database Validation Checklist**:
- ✅ All 7 migrations executed successfully
- ✅ Tables created: profiles, journal, entry, pages, writing_prompts
- ✅ RLS policies active on all tables
- ✅ Admin security (3-layer) working
- ✅ Soft delete functional (deleted_at column)
- ✅ Optional enhancements deployed (mood + prompts)

### ✅ Completed: Security E2E Test Suite

**Status**: Implemented with test infrastructure fixes

**What Was Built**:
- `tests/admin-setup.ts` (145 lines) - Admin authentication setup
- `tests/admin-setup.spec.ts` (15 lines) - Admin test wrapper
- `tests/security.spec.ts` (507 lines) - 103 comprehensive security tests
- Fixed 55 test infrastructure issues (navigation selectors, logout flow, disabled buttons)
- Implemented two-user test strategy (regular + admin)

**Test Coverage** (103 tests across 6 browsers):
- ✅ Authentication security (48 tests) - 100% passing
- ⚠️ Authorization security (24 tests) - Needs session regeneration
- ⚠️ Session security (12 tests) - Needs session regeneration
- ⚠️ Content security (18 tests) - Needs test data
- ⚠️ Accessibility (varies) - Needs verification

**Current Status**: Tests implemented but need fresh test users and data after database recovery.

**Next Steps**:
1. Create new E2E test users in new database
2. Regenerate authentication files
3. Run test suite: `npm run test:security`

### 📋 Post-Recovery Validation

**Manual Testing Required**:
1. Advanced search features (date range, word count filters, archived toggle)
2. Admin CMS functionality (pages CRUD, access control)
3. **NEW**: Mood tracking (entry creation with mood selection)
4. **NEW**: Writing prompts (admin CMS management, user prompt fetching)

---

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

## 🎯 Agent Selection Decision Tree

**Use this flowchart BEFORE starting any task:**

```
┌─────────────────────────────────────────────┐
│  New Task Received                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ What type of work? │
         └────────┬───────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┬─────────────┬─────────────┐
    │             │             │             │             │             │
    ▼             ▼             ▼             ▼             ▼             ▼
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│React/  │   │Testing/│   │Database│   │  Docs  │   │  Repo  │   │Release/│
│Frontend│   │  E2E   │   │  /RLS  │   │Writing │   │ Maint. │   │ Deploy │
└───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘   └───┬────┘
    │            │            │            │            │            │
    ▼            ▼            ▼            ▼            ▼            ▼
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐
│react-  │   │playwright│  │db-rls- │   │docs-   │   │repo-   │   │release-│
│frontend│   │-qa-lead│   │guardian│   │scribe  │   │librarian│  │captain │
│-shipper│   │        │   │        │   │        │   │-vite   │   │        │
└────────┘   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘
```

### Quick Reference Checklist

**Before starting, ask yourself:**

- [ ] **Is this React/UI work?** → Use `react-frontend-shipper`
  - Components, pages, forms, styling, Supabase integration

- [ ] **Is this testing work?** → Use `playwright-qa-lead`
  - E2E tests, visual regression, accessibility tests, test setup

- [ ] **Is this database work?** → Use `db-rls-guardian`
  - Schema changes, RLS policies, migrations, security verification

- [ ] **Is this documentation?** → Use `docs-scribe`
  - User guides, admin docs, handoff notes, README updates

- [ ] **Is this repo cleanup?** → Use `repo-librarian-vite`
  - PROJECT.md updates, TODO maintenance, dead file removal

- [ ] **Is this release/deploy work?** → Use `release-captain`
  - Git workflows, version control, release scripts, secret protection

- [ ] **None of the above?** → Handle directly (only if simple 1-2 file edit)

---

## Agent Usage Guidelines

**IMPORTANT**: Always proactively suggest appropriate specialized agents for tasks that match their capabilities. Don't wait for explicit requests.

### Available Specialized Agents

#### 1. `react-frontend-shipper`
**Use for**: React + TypeScript + Tailwind frontend implementation
- Implementing new React components with proper TypeScript types
- Adding Supabase integration to frontend features
- Building admin guards, CMS editors, or form UX improvements
- Polishing UI with Tailwind styling aligned to brand (pink gradients)
- **Example**: "I'll use the react-frontend-shipper agent to implement the new search filters UI"

#### 2. `playwright-qa-lead`
**Use for**: E2E testing setup and enhancement
- Setting up new Playwright test suites
- Adding screenshot-based visual regression tests
- Implementing accessibility checks with axe-core
- Creating test helpers for authentication flows
- Setting up artifact collection systems
- **Example**: "I'll use the playwright-qa-lead agent to create E2E tests for the admin CMS functionality"

#### 3. `db-rls-guardian`
**Use for**: Database schema and security
- Designing or modifying table structures
- Creating or updating RLS policies
- Adding indexes for performance
- Writing security verification tests
- Reviewing migrations for safety
- **Example**: "I'll use the db-rls-guardian agent to add RLS policies for the new notifications table"

#### 4. `docs-scribe`
**Use for**: Documentation creation
- Creating role-specific documentation (admin guides, developer handoff, user guides)
- Writing onboarding documentation
- Producing scannable, checklist-oriented docs
- Creating handoff notes for project transitions
- **Example**: "I'll use the docs-scribe agent to create admin quickstart documentation"

#### 5. `repo-librarian-vite`
**Use for**: Repository maintenance
- Updating PROJECT.md with routes and data flow
- Maintaining focused TODO.md (top 10 items)
- Identifying and removing duplicate or dead files
- Cleaning up project structure
- **Example**: "I'll use the repo-librarian-vite agent to update PROJECT.md and clean up stale files"

#### 6. `release-captain`
**Use for**: Release processes and git hygiene
- Setting up release workflows
- Creating pre-release check scripts
- Establishing proper .gitignore rules
- Setting up secret detection mechanisms
- Creating version control best practices
- **Example**: "I'll use the release-captain agent to set up the release process with safety checks"

### When NOT to Use Agents

Handle directly without agents for:
- Simple component edits (1-2 file changes)
- Bug fixes requiring immediate investigation
- Reading and analyzing existing code
- Quick configuration changes
- Straightforward text updates

### Agent Selection Examples

| Task | Agent | Reason |
|------|-------|--------|
| Add date range filter to search page | `react-frontend-shipper` | Frontend feature implementation |
| Create tests for trash bin functionality | `playwright-qa-lead` | E2E testing with screenshots |
| Add RLS policies for new table | `db-rls-guardian` | Database security work |
| Write admin user guide | `docs-scribe` | Documentation creation |
| Clean up old migration files | `repo-librarian-vite` | Repository maintenance |
| Set up GitHub Actions for deployment | `release-captain` | Release process automation |
| Fix Navigation re-rendering bug | None (handle directly) | Simple 1-line fix |

### Agent Workflow Pattern

When suggesting an agent:
1. **Identify the task type** (frontend, testing, database, docs, maintenance, release)
2. **Match to appropriate agent** from the list above
3. **Announce the agent choice**: "I'll use the [agent-name] agent to [task description]"
4. **Use the Task tool** with proper `subagent_type` parameter
5. **Provide clear task description** in the prompt parameter

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

## UX Improvement Roadmap

This section documents planned enhancements to improve user experience across the application. Improvements are prioritized based on impact and effort.

### 🔴 Critical Priority (High Impact, Must-Have)

#### 1. Profile Edit Capabilities ✅ **COMPLETED**
- **Status**: Implemented
- **Impact**: High - Users need to manage their own profile information
- **Files Modified**:
  - `src/components/EditProfileModal.tsx` - Display name editing
  - `src/components/ChangePasswordModal.tsx` - Password changes with validation
  - `src/pages/ProfilePage.tsx` - Integration of edit modals
  - `src/lib/supabase-database.ts` - Profile service methods
- **Features**:
  - Edit display name with validation (1-50 chars, letters/numbers/spaces/hyphens/apostrophes)
  - Change password with strength requirements (8+ chars, uppercase, lowercase, number)
  - Real-time validation feedback
  - Toast notifications for success/error
  - Clear error messages for session expiry

#### 2. Session Management Improvements ✅ **COMPLETED**
- **Status**: Implemented
- **Impact**: High - Fixed infinite loading loops and session persistence issues
- **Files Created**:
  - `src/lib/session.ts` - Centralized session validation
- **Files Modified**:
  - `src/lib/supabase.ts` - Removed commitSha from storage key, added cleanup
  - `src/lib/authListener.ts` - Disabled visibility listener, added token refresh check
  - `src/stores/journalStore.ts` - Added requireSession() to all CRUD methods
  - `src/components/EditProfileModal.tsx` - Session error handling
  - `src/components/ChangePasswordModal.tsx` - Session error handling
- **Features**:
  - SessionExpiredError class for clear error detection
  - Storage key cleanup removes orphaned sessions
  - Loading states always clear with finally blocks
  - Token refresh check prevents unnecessary re-renders
  - Friendly session expiry messages with redirect

#### 3. Calendar Quick Entry Creation ✅ **COMPLETED**
- **Status**: Implemented
- **Impact**: High - Major UX friction eliminated
- **Files Created**:
  - `src/components/QuickEntryModal.tsx` - Quick entry creation modal
- **Files Modified**:
  - `src/pages/CalendarPage.tsx` - Click handler for empty dates, edit/delete controls
- **Features**:
  - Click empty date → Opens quick entry modal with date pre-filled
  - Timezone-safe date display (parse as local, not UTC)
  - Journal selector, content textarea with character count
  - Session expiry detection with redirect
  - Edit/delete icon buttons in calendar sidebar
  - Delete confirmation modal with proper loading states

### 🟡 Medium Priority (Medium-High Impact)

#### 4. Search Improvements
- **Current Limitations**: Only searches entry content, no date range, no advanced filters
- **Impact**: Medium-High - Power users need better search
- **Effort**: Medium
- **Planned Features**:
  - Date range picker (from X to Y)
  - Filter sidebar: journal, date range, word count range
  - Search operators (AND, OR, NOT, "exact phrase")
  - Save search feature for recurring queries
  - Export results to PDF/TXT
  - Search history dropdown (last 5 searches)
  - Sorting: relevance, date (newest/oldest), word count
- **Files to Modify**:
  - `src/pages/SearchPage.tsx` - Add filters and advanced search
  - `src/stores/journalStore.ts` - Update `searchEntries()` method

#### 5. Dashboard Customization
- **Current Limitations**: Fixed layout, can't customize widgets, no insights
- **Impact**: Medium - Users want personalized dashboard
- **Effort**: High
- **Planned Features**:
  - Draggable/resizable widget system
  - Customizable stat cards (choose from 10+ metrics)
  - "Quick Write" inline textarea for fast entry creation
  - "Daily Prompt" widget for inspiration
  - "Writing Streaks" calendar heatmap (GitHub-style)
  - "Insights" widget (most used words, writing patterns)
  - Goal setting (e.g., "Write 500 words/day")
  - "Pinned Entry" widget for important notes
- **Files to Modify**:
  - `src/pages/DashboardPage.tsx` - Widget system implementation
  - `src/components/widgets/` (new directory) - Individual widget components

#### 6. Enhanced Entry Creation
- **Current Limitations**: Plain textarea, no rich text, no auto-save, no templates
- **Impact**: Medium - Users want better writing experience
- **Effort**: High
- **Planned Features**:
  - Rich text editor (TipTap or Lexical) with formatting toolbar
  - Auto-save to localStorage every 30 seconds
  - Entry templates library ("Gratitude," "Daily Reflection," "Dream Log")
  - Writing prompts modal with 50+ prompts
  - Image upload with preview
  - Tags/labels for entries
  - Mood selector (😊 😐 😔 😢 😡)
  - Word count goal indicator with progress bar
  - "Save as Template" option
- **Files to Create**:
  - `src/components/RichTextEditor.tsx` - Rich text editor wrapper
  - `src/components/TemplateLibrary.tsx` - Entry templates
  - `src/components/WritingPrompts.tsx` - Prompt suggestions
- **Files to Modify**:
  - `src/pages/NewEntryPage.tsx` - Integration of new features
  - `src/pages/EditEntryPage.tsx` - Rich text editing

#### 7. Navigation Improvements
- **Current Limitations**: No breadcrumbs, no context on deep pages, no keyboard shortcuts
- **Impact**: Medium - Users get lost on deep pages
- **Effort**: Low-Medium
- **Planned Features**:
  - Breadcrumbs on all protected pages: "Dashboard > Journals > My Gratitude Journal > Edit Entry"
  - Persistent journal indicator in header when viewing journal-specific pages
  - Keyboard shortcuts overlay (press "?" to see shortcuts)
  - Redesign mobile menu as bottom sheet (not full screen)
  - "Recently Viewed" section in navigation dropdown
  - Search in navigation (⌘K command palette)
- **Files to Create**:
  - `src/components/Breadcrumbs.tsx` - Breadcrumb navigation
  - `src/components/KeyboardShortcuts.tsx` - Shortcuts overlay
- **Files to Modify**:
  - `src/components/Navigation.tsx` - Add breadcrumbs and shortcuts

### 🟢 Low Priority (Nice-to-Have, Future Features)

#### 8. Data Visualization & Analytics
- **Current Limitations**: Basic stats only, no charts or trends
- **Impact**: Low-Medium - Users want writing insights
- **Effort**: High
- **Planned Features**:
  - Writing activity heatmap (contributions-style calendar)
  - Word count over time line chart
  - Most active journals pie chart
  - Writing time of day analysis
  - Mood tracking visualizations
  - Longest streak tracking
- **Files to Create**:
  - `src/components/charts/` (new directory) - Chart components
  - `src/pages/AnalyticsPage.tsx` - Dedicated analytics page

#### 9. Export & Backup Features
- **Current Limitations**: Text export only, no PDF/Markdown/DOCX, no full backups
- **Impact**: Low - Users want data portability
- **Effort**: Medium
- **Planned Features**:
  - Export to PDF with formatting and cover page
  - Export to Markdown for portability
  - Export to DOCX for Word compatibility
  - Full account backup (all journals + entries as ZIP)
  - Scheduled auto-backups to email/cloud
  - Import from other journaling apps (Day One, Journey)
- **Files to Create**:
  - `src/services/export.ts` - Export service for multiple formats
  - `src/services/import.ts` - Import service from external apps
- **Files to Modify**:
  - `src/stores/journalStore.ts` - Update `exportJournal()` method

### Implementation Priority Matrix

| Feature | Impact | Effort | Status | Priority |
|---------|--------|--------|--------|----------|
| Profile Edit | High | Medium | ✅ Completed | Critical |
| Session Management | High | Low | ✅ Completed | Critical |
| Calendar Quick Entry | High | Low-Med | ✅ Completed | Critical |
| Entry Editing | High | Low | ✅ Completed | Critical |
| Search Improvements | Med-High | Medium | 📋 Planned | Medium |
| Dashboard Customization | Medium | High | 📋 Planned | Medium |
| Rich Entry Creation | Medium | High | 📋 Planned | Medium |
| Navigation Breadcrumbs | Medium | Low-Med | 📋 Planned | Medium |
| Data Visualization | Low-Med | High | 💭 Future | Low |
| Export/Backup | Low | Medium | 💭 Future | Low |

### Design Principles for UX Improvements

When implementing these improvements, follow these principles:

1. **Simplicity First**: Don't overcomplicate. Smallest diffs, minimal abstractions.
2. **Centralized Logic**: Keep business logic at service/store boundary, not in components.
3. **Consistent Patterns**: Follow existing patterns (modals, toasts, error handling).
4. **WCAG AA Compliance**: All new features must meet 4.5:1 contrast ratio.
5. **Mobile-First**: Responsive design for all new components.
6. **Session-Aware**: All protected operations check session validity.
7. **Progressive Enhancement**: Core functionality works without fancy features.
8. **Clear Error Messages**: User-friendly error messages with actionable guidance.

### Next Steps

**Phase 1: Critical Fixes ✅ COMPLETED**
1. ✅ Profile edit capabilities
2. ✅ Session management improvements
3. ✅ Calendar quick entry creation
4. ✅ Entry editing fixes

**Phase 2: Major Enhancements (Weeks 3-4)**
4. Search improvements with filters
5. Entry auto-save and basic rich text
6. Navigation breadcrumbs (quick win)

**Phase 3: Advanced Features (Month 2)**
7. Dashboard customization basics
8. Full rich text editor with templates
9. Data visualization dashboard

**Phase 4: Polish & Export (Month 3+)**
10. Export/backup suite
11. Analytics page
12. Import from other apps