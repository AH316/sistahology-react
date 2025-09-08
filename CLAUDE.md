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

# Run E2E tests
npm run test:e2e

# Run regression tests with @regression tag
npm run test:regression

# Run E2E tests with UI mode for debugging
npm run test:e2e:ui

# Update homepage hero snapshots
npm run snap:home

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
- **Test artifacts**: Screenshots and accessibility reports in `test/artifacts/`
- **Regression tests**: Tagged with `@regression` in `tests/regression-fixes.spec.ts`

### Common Testing Patterns

**Data Test IDs**: Components use `data-testid` attributes for E2E testing:
- `hero-card`, `hero-decor` - Homepage hero elements
- `journal-select`, `journal-editor`, `save-entry` - New entry form
- `toast-root` - Toast notifications
- `login-form`, `register-form` - Authentication forms

**Auth Testing**: Tests use `tests/.auth/user.json` for authenticated sessions
**Accessibility**: Run `tests/accessibility.spec.ts` to generate axe-core reports in `test/artifacts/accessibility/`
**Visual Regression**: Homepage snapshots stored in `test/artifacts/screens/`

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

**Service Layer Architecture**:
- `src/services/posts/`: Blog posts service with static provider
- `src/services/pages.ts`: CMS pages service for dynamic content
- `src/lib/supabase-database.ts`: Abstraction layer with type conversion and `ApiResponse<T>` pattern

**Authentication Flow**:
- Auth singleton prevents multiple initialization calls during HMR
- `AuthRedirect` component prevents authenticated users from accessing auth pages
- Session persistence with Zustand and ref-based guards for React StrictMode

**Journal System**:
- Multi-journal support with color coding
- Entry creation with timezone-safe date handling (`toYYYYMMDD` utility)
- Search functionality across journal entries
- Calendar view for entry navigation

**Content Management**:
- CMS system for home page content via `pages` table
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

**Date Handling**:
- Use `toYYYYMMDD()` utility for timezone-safe formatting
- Validate against future dates in journal entries
- Use `formatDate()` for display formatting

**Content Security**:
- HTML sanitization with DOMPurify
- RLS policies on all Supabase tables
- Specific class whitelisting for pink accent styling

**Performance**:
- Zustand persistence for offline-first experience
- React Strict Mode guards for singleton initialization
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
- **Auth Store**: `src/stores/authStore.ts` - Singleton pattern, HMR-safe initialization
- **Journal Store**: `src/stores/journalStore.ts` - Persisted state management

### Testing Infrastructure
- **Test Setup**: `tests/global-setup.ts` - Auth session creation for E2E tests
- **Regression Suite**: `tests/regression-fixes.spec.ts` - Core functionality tests

### Database Security
- **RLS Verification**: `db/VERIFY_READONLY.sql` - Non-destructive security testing
- **Schema Export**: `db/exports/schema.sql` - Complete database structure

### Services & Utilities
- **Database Abstraction**: `src/lib/supabase-database.ts` - Type-safe API layer
- **Date Utilities**: `src/utils/date.ts` - Timezone-safe date handling (`toYYYYMMDD`)
- **CMS Service**: `src/services/pages.ts` - Dynamic content management

### Admin Scripts
- **Admin Role Script**: `scripts/setAdminRole.ts` - Grant admin role to users via service account
- **Admin Password**: `scripts/setAdminPassword.ts` - Reset admin user passwords  
- **Quick Admin**: `scripts/quickCreateAdmin.ts` - Create new admin users
- **Environment**: Uses `.env.scripts` with service role key for admin operations