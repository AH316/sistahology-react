# PROJECT.md - Sistahology React Application

## Application Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite 7.0
- **Styling**: Tailwind CSS 4.1 with custom Sistahology brand colors
- **Backend**: Supabase (PostgreSQL with RLS)
- **State**: Zustand with persistence middleware
- **Routing**: React Router DOM 7.7
- **Forms**: React Hook Form + Zod validation

## Route Structure

### Public Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `HomePage` | Landing page with CMS content from `pages` table |
| `/login` | `LoginPage` | User authentication (redirects to dashboard if authenticated) |
| `/register` | `RegisterPage` | New user registration (redirects to dashboard if authenticated) |
| `/forgot-password` | `ForgotPasswordPage` | Password reset flow |
| `/blog` | `BlogPage` | Blog listing (static provider, CMS-ready) |
| `/blog/:slug` | `BlogPostPage` | Individual blog post display |
| `/about` | `AboutPage` | About page (CMS-ready) |
| `/contact` | `ContactPage` | Contact information |
| `/news` | `NewsPage` | News and events |

### Protected Routes (require authentication)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `DashboardPage` | User dashboard with stats and recent entries |
| `/calendar` | `CalendarPage` | Calendar view of journal entries |
| `/search` | `SearchPage` | Search across all journal entries |
| `/new-entry` | `NewEntryPage` | Create new journal entry |

## Database Schema (Supabase)

### Tables

#### `profiles`
- User profile information
- Fields: `id`, `email`, `full_name`, `created_at`, `updated_at`
- RLS: Users can only access their own profile

#### `pages`
- CMS content for static pages
- Fields: `slug`, `title`, `content_html`, `created_at`, `updated_at`
- RLS: Public read, admin write
- Used by: `HomePage` (slug='home' for hero content)

#### `journal`
- User's journal metadata
- Fields: `id`, `user_id`, `journal_name`, `color`, `created_at`, `updated_at`
- RLS: Users can only access their own journals
- Relationships: One-to-many with `entry` table

#### `entry`
- Journal entries content
- Fields: `id`, `user_id`, `journal_id`, `title`, `content`, `entry_date`, `is_archived`, `created_at`, `updated_at`
- RLS: Users can only access their own entries
- Relationships: Many-to-one with `journal` table

## Data Flow Architecture

### Authentication Flow
```
1. App.tsx initializes with auth singleton (authStore.ts)
   ↓
2. Auth listener checks Supabase session (authListener.ts)
   ↓
3. Session state stored in Zustand (useAuthStore)
   ↓
4. ProtectedRoute components check auth state
   ↓
5. AuthRedirect prevents authenticated users from auth pages
```

### Journal Data Flow
```
1. User authenticates → profile loaded
   ↓
2. Dashboard/NewEntry loads journals via supabaseDatabase.journals.getAll()
   ↓
3. Journal selection stored in Zustand (journalStore.ts)
   ↓
4. Entry creation via supabaseDatabase.entries.create()
   ↓
5. Real-time updates via Supabase subscriptions
```

### CMS Content Flow
```
1. HomePage loads → getPage('home') from services/pages.ts
   ↓
2. Queries Supabase `pages` table for slug='home'
   ↓
3. HTML content sanitized with DOMPurify (allows pink accent classes)
   ↓
4. Rendered with prose styling and pink accents
   ↓
5. Fallback to static content if DB unavailable
```

## Service Layer Architecture

### `/src/lib/`
- `supabase.ts` - Singleton Supabase client initialization
- `supabase-auth.ts` - Authentication service methods
- `supabase-database.ts` - Database operations abstraction
- `authListener.ts` - Auth state change listener
- `authRuntime.ts` - Environment-aware auth initialization

### `/src/services/`
- `pages.ts` - CMS page fetching with pink accent preservation
- `posts/` - Blog post service (static provider, CMS-ready architecture)

### `/src/stores/`
- `authStore.ts` - Authentication state management
- `journalStore.ts` - Journal and entry state with persistence

## Component Hierarchy

```
App.tsx
├── ErrorBoundary
├── Router
│   ├── Public Routes
│   │   ├── HomePage
│   │   │   ├── Navigation
│   │   │   ├── Hero (CMS content from pages.slug='home')
│   │   │   └── Quick Links
│   │   ├── LoginPage
│   │   │   └── AuthRedirect wrapper
│   │   ├── RegisterPage
│   │   │   └── AuthRedirect wrapper
│   │   └── BlogPage/BlogPostPage
│   │       └── Static posts (CMS-ready)
│   └── Protected Routes
│       ├── ProtectedRoute wrapper
│       │   ├── DashboardPage
│       │   │   ├── Stats
│       │   │   ├── Recent Entries
│       │   │   └── Journal List
│       │   ├── NewEntryPage
│       │   │   ├── Journal Selector
│       │   │   ├── Date Picker
│       │   │   └── Content Editor
│       │   └── CalendarPage
│       │       └── Entry Calendar View
│       └── Navigation (shared)
```

## Key Architectural Decisions

### 1. Singleton Pattern for Auth
- Prevents multiple initialization in React StrictMode
- Uses ref-based guards for HMR safety
- Environment-aware runtime selection (dev vs prod)

### 2. Service Abstraction Layer
- Database operations abstracted in `supabase-database.ts`
- Type conversion utilities for Supabase ↔ React types
- ApiResponse<T> pattern for consistent error handling

### 3. CMS Content with Pink Accents
- DOMPurify configured to allow specific pink styling classes
- `ensureHomeAccents()` function preserves brand styling
- Fallback to static content when DB unavailable

### 4. Multi-Journal Architecture
- Users can create multiple journals with color coding
- Journal selection persisted in Zustand store
- Entries linked to specific journals with RLS

### 5. Timezone-Safe Date Handling
- `toYYYYMMDD()` utility prevents timezone shifts
- Future date validation for journal entries
- Local date formatting for display

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS policies enabled
- Users can only access their own data
- Public read for `pages` table, admin write only

### Environment Variables
- Sensitive config in `.env.local` (never committed)
- `.env.example` provided for setup reference
- Supabase anon key safe for client-side use

### Content Sanitization
- All HTML content sanitized with DOMPurify
- Whitelist specific classes for pink styling
- XSS protection for user-generated content

## Performance Optimizations

### State Persistence
- Zustand stores with localStorage persistence
- Offline-first journal experience
- Session caching for auth state

### Code Splitting
- Route-based lazy loading ready
- Vite optimized builds
- HMR for fast development

### Real-time Updates
- Supabase subscriptions for live data
- Optimistic UI updates for better UX
- Debounced search queries