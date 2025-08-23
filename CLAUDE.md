# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistahology is a React + TypeScript + Vite application for a women's journaling platform. The application focuses on providing a private, beautiful journaling experience with a floral/feminine design aesthetic using pink gradients and a gerbera daisy hero background.

## Environment Setup

Create a `.env.local` file with the following required variables:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
```

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

## Architecture Overview

### Database Schema (Supabase)
- `journal` table: User journals with metadata
- `entry` table: Journal entries with content and dates
- `pages` table: CMS content for static pages
- Row Level Security (RLS) enabled with user-based access control

### Route Structure
**Public Routes:**
- `/` - HomePage with CMS content
- `/blog` - Blog listing page
- `/blog/:slug` - Individual blog post pages
- `/about` - About page
- `/contact` - Contact page
- `/news` - News page
- `/login` - Login page (redirects to dashboard if authenticated)
- `/register` - Registration page (redirects to dashboard if authenticated)
- `/forgot-password` - Password reset

**Protected Routes (require authentication):**
- `/dashboard` - User dashboard with stats and recent entries
- `/calendar` - Calendar view of journal entries
- `/search` - Search across journal entries
- `/new-entry` - Create new journal entry

### Core Application Flow
1. **Authentication**: Singleton-based auth initialization in `authStore.ts`
2. **Routing**: Public routes (home, blog, auth) + protected routes (dashboard, calendar, new entry)
3. **Journaling**: Multi-journal support with entries, search, calendar view
4. **CMS**: Admin-editable content for home page with pink accent styling
5. **Blog**: Service-based architecture for future CMS integration

### State Management Architecture
- **AuthStore**: Zustand store managing authentication state with Supabase session
- **JournalStore**: Persisted Zustand store for journals, entries, and dashboard stats
- **Local State**: React hooks for component-specific state

### Key Design Patterns

**Service Layer Architecture**:
- `src/services/posts/`: Blog posts service with static provider and future CMS support
- `src/services/pages.ts`: CMS pages service for dynamic content
- Service abstraction allows easy switching between data sources (static, Supabase, external CMS)

**Supabase Integration**:
- `src/lib/supabase-database.ts`: Abstraction layer over Supabase with type conversion
- `src/types/supabase.ts`: Type conversion utilities between Supabase and React types
- Error handling with `ApiResponse<T>` pattern
- Singleton pattern for client initialization (HMR-safe)

**Authentication Flow**:
- Auth singleton prevents multiple initialization calls
- `ProtectedRoute` component handles auth guards with loading states
- `AuthRedirect` prevents authenticated users from accessing auth pages
- Session persistence with Zustand and ref-based guards for StrictMode

**Journal System**:
- Multi-journal support with color coding and organization
- Entry creation with timezone-safe date handling (`toYYYYMMDD` utility)
- Search functionality across journal entries
- Calendar view for entry navigation

**Content Management**:
- CMS system for home page content via `pages` table
- Pink accent styling system with `ensureHomeAccents()` function
- HTML sanitization with DOMPurify allowing specific styling classes
- Blog posts with Zod validation for runtime type safety

### Component Structure

**UI Components** (`src/components/ui/`):
- Toast system for user feedback
- Modal and confirmation dialogs
- Form inputs with error handling
- Loading spinners and cards

**Page Components** (`src/pages/`):
- Route-based page organization
- Consistent error boundary wrapping
- Navigation component integration

**Specialized Components**:
- Error boundaries for different contexts (Form, Journal, Page)
- Authentication wrappers (Protected routes, auth redirects)
- InlineError component for non-critical error display

### Styling System

**Tailwind Configuration**:
- Custom Sistahology brand colors (`sistah-pink`, `sistah-rose`, `sistah-purple`)
- Float animations for decorative elements
- Glass morphism effects with backdrop blur

**Design Language**:
- Pink gradient color palette throughout
- Gerbera daisy background for hero sections
- Floating flower decorations with CSS animations
- Glass container effects for content areas

### Development Considerations

**TypeScript Configuration**:
- Split configuration: `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tools)
- Strict type checking enabled
- Project references for better build performance

**Date Handling**:
- Use `toYYYYMMDD()` utility for timezone-safe date formatting
- Validate against future dates in journal entries
- Use `formatDate()` from `utils/performance.ts` for display formatting

**Content Security**:
- HTML sanitization with DOMPurify
- Specific class whitelisting for pink accent styling
- RLS policies on all Supabase tables
- Environment variables for sensitive configuration

**Performance**:
- Zustand persistence for offline-first journaling experience
- React Strict Mode guards for singleton initialization
- Vite hot module replacement for fast development
- Lazy loading for route components
- Service worker ready (PWA capable)

**Error Handling Hierarchy**:
1. Page-level errors: `PageErrorBoundary`
2. Journal-specific errors: `JournalErrorBoundary`
3. Form errors: `FormErrorBoundary`
4. Non-critical errors: `InlineError` component
5. API errors: `ApiResponse<T>` pattern

## Database Tables

- `journal`: User's journal metadata (name, color, user_id)
- `entry`: Journal entries (content, entry_date, journal_id, user_id)
- `pages`: CMS content (slug, title, content_html)

All tables have RLS enabled with user-based access control.