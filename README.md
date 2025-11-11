# Sistahology

**A beautiful, secure journaling platform designed for women.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.1-61dafb?logo=react)
![License](https://img.shields.io/badge/license-MIT-green)

> A modern, privacy-focused journaling application with multi-journal support, calendar views, powerful search, and comprehensive security. Built with React 19, TypeScript, and Supabase.

[Live Demo](#) | [Features](#features) | [Tech Stack](#tech-stack) | [Getting Started](#getting-started) | [Documentation](#documentation)

---

## About

**Sistahology** is a full-featured journaling platform that combines beautiful design with robust functionality. Whether you're keeping a gratitude journal, tracking your thoughts, or documenting your journey, Sistahology provides a private, intuitive space for your writing.

### Design Philosophy

Built with a warm, feminine aesthetic featuring pink gradients and gerbera daisy themes, Sistahology creates a welcoming environment for personal reflection. The application employs glass morphism effects, responsive design, and thoughtful UX patterns to make journaling feel natural and enjoyable.

### Technical Excellence

Under the hood, Sistahology demonstrates modern full-stack development practices:
- **Type Safety**: 100% TypeScript with strict configuration
- **Security First**: Row-level security (RLS) with 17 database policies protecting user data
- **Test Coverage**: 340+ E2E tests with Playwright across 6 browser configurations
- **Accessibility**: WCAG 2.1 AA compliance with semantic HTML and ARIA attributes
- **Performance**: Optimized state management with Zustand and efficient database queries

---

## Features

### 📚 For Journal Writers

**Multi-Journal Support**
- Create unlimited journals with custom names and colors
- Color-coded badges for easy identification
- Switch seamlessly between journals
- Each journal maintains independent entries and settings

**Rich Entry Management**
- Create, edit, and organize journal entries
- 30-day trash bin with recovery window
- Archive entries to declutter without deleting
- Bulk operations (delete and recover multiple entries at once)
- Mood tracking with 6 mood options (happy, sad, anxious, excited, grateful, neutral)

**Calendar View**
- Visual calendar with entry indicators
- Quick entry modal for creating dated entries
- Navigate by month to view historical entries
- Color-coded dots show which journal contains entries

**Powerful Search**
- Full-text search across all journal entries
- Advanced filters (date range, word count, sort options)
- Filter by specific journal or search across all
- Toggle to include/exclude archived entries
- Instant results as you type

**Dashboard & Analytics**
- Overview of all journaling activity
- Writing streak calculation
- Recent entries across all journals
- Quick stats (total entries, archived count, last entry date)
- Writing prompts library with 15+ curated prompts

**Privacy & Security**
- End-to-end user data isolation
- Secure authentication via Supabase
- Row-level security policies on all tables
- No ads, no tracking, no data sharing

### 🛠️ For Developers

**Architecture Highlights**
- **Frontend**: React 19 with TypeScript, Vite 7.0, Tailwind CSS 4.1
- **Backend**: Supabase (PostgreSQL with RLS, real-time subscriptions)
- **State Management**: Zustand with localStorage persistence
- **Routing**: React Router DOM 7.7 with HashRouter for GitHub Pages
- **Testing**: Playwright E2E tests with visual regression and accessibility checks
- **Security**: 3-layer admin protection, soft delete, session management

**Key Technical Features**
- Singleton-based auth initialization for HMR safety
- Ref-based concurrency guards for React StrictMode
- Static-first content loading for optimal performance
- DOMPurify HTML sanitization with class whitelisting
- Timezone-safe date handling utilities
- Comprehensive error boundaries (page, form, journal-level)

**Code Quality**
- ESLint with TypeScript-aware rules
- Type-safe API layer with `ApiResponse<T>` pattern
- Service layer architecture for business logic
- Idempotent database migrations
- Non-destructive verification scripts

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript 5.8, Vite 7.0, Tailwind CSS 4.1 |
| **Backend** | Supabase (PostgreSQL, Auth, Real-time) |
| **State** | Zustand (with persistence middleware) |
| **Forms** | React Hook Form, Zod validation |
| **Routing** | React Router DOM 7.7 (HashRouter) |
| **Testing** | Playwright (340+ E2E tests), axe-core (accessibility) |
| **Icons** | Lucide React |
| **Security** | DOMPurify, Row-Level Security (RLS) |
| **Deployment** | GitHub Pages, GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sistahology-react.git
cd sistahology-react

# Install dependencies
npm install

# Install Playwright browsers (for testing)
npm run test:install
```

### Environment Setup

Create a `.env.local` file with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

For E2E testing, create `.env.test`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
E2E_USER_EMAIL=test@example.com
E2E_USER_PASSWORD=test-password
```

For admin operations, create `.env.scripts`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Database Setup

Follow the comprehensive 7-step database setup guide:

```bash
# See DATABASE_SETUP.md for complete instructions
# Execute migrations 004-010 sequentially in Supabase SQL Editor
# Estimated time: 30-35 minutes
```

Key migrations include:
1. Base schema (profiles, journals, entries, pages)
2. Soft delete functionality (30-day trash bin)
3. Admin role infrastructure
4. Admin security hardening (3-layer protection)
5. Journal icon support
6. Home page content seed
7. Optional enhancements (mood tracking, writing prompts)

### Running Locally

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run regression tests only
npm run test:regression

# Run journal flow tests
npm run test:journals

# Run security tests
npm run test:security

# Run with UI mode for debugging
npm run test:e2e:ui
```

### Deployment

```bash
# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## Documentation

### For Site Owners & Administrators
- **[User Guide](FEATURES.md)** - Complete feature walkthrough for journal writers
- **Database Setup** - See `DATABASE_SETUP.md` for initial configuration

### For Developers
- **[Architecture Overview](CLAUDE.md)** - Project structure, patterns, and development guide
- **[Testing Strategy](TESTING.md)** - E2E test coverage, commands, and best practices
- **[Database Recovery](DATABASE_RECOVERY.md)** - Disaster recovery procedures and incident report
- **[Security Audit](SECURITY_AUDIT_EXECUTIVE_SUMMARY.md)** - Security posture and compliance status
- **[Accessibility Status](ACCESSIBILITY_COMPLIANCE_STATUS.md)** - WCAG 2.1 AA compliance report

### Quick Reference
- **Route Structure**: See `CLAUDE.md` for complete route map (11 protected, 7 public pages)
- **Data Test IDs**: Components use `data-testid` attributes for E2E testing
- **Admin Scripts**: `scripts/setAdminRole.ts`, `scripts/setAdminPassword.ts`, `scripts/quickCreateAdmin.ts`

---

## Security

### Security Posture

Sistahology takes security seriously with multiple layers of protection:

**Authentication & Authorization**
- Secure authentication via Supabase Auth
- Session management with auto-recovery
- Protected routes requiring authentication
- Admin role-based access control (RBAC)

**Database Security**
- Row-Level Security (RLS) enabled on all tables
- 17 RLS policies enforcing user data isolation
- 3-layer admin protection (column defaults, RLS policies, trigger protection)
- Soft delete for 30-day recovery window

**Content Security**
- HTML sanitization with DOMPurify
- Specific class whitelisting for styling
- XSS prevention on all user-generated content
- CSRF protection via Supabase

**Comprehensive Testing**
- 340+ E2E security tests across 6 browser configurations
- 100% authentication security test pass rate
- Regular accessibility audits with axe-core
- Non-destructive verification scripts

For detailed security analysis, see [Security Audit Executive Summary](SECURITY_AUDIT_EXECUTIVE_SUMMARY.md).

---

## Accessibility

Sistahology is committed to WCAG 2.1 AA compliance:

- Semantic HTML structure with proper landmarks
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast optimization (4.5:1 ratio)
- Screen reader compatibility
- Focus management in modals and dialogs

**Current Compliance**: Partial AA compliance with ongoing improvements. See [Accessibility Compliance Status](ACCESSIBILITY_COMPLIANCE_STATUS.md) for detailed report.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository** and create a feature branch
2. **Write tests** for new features (see `TESTING.md` for patterns)
3. **Follow existing code style** (TypeScript, ESLint rules)
4. **Add data-testid attributes** to interactive elements
5. **Run full test suite** before submitting PR
6. **Update documentation** if adding/changing features

### Testing Checklist for New Features
- Add E2E tests covering happy path and error cases
- Test both authenticated and unauthenticated scenarios
- Verify accessibility (keyboard navigation, ARIA labels)
- Check responsive behavior (mobile, tablet, desktop)
- Run `npm run test:regression` to ensure no regressions

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

- **Repository**: [github.com/yourusername/sistahology-react](https://github.com/yourusername/sistahology-react)
- **Issues**: [github.com/yourusername/sistahology-react/issues](https://github.com/yourusername/sistahology-react/issues)
- **Email**: contact@sistahology.com

---

## Note for Technical Recruiters

**What This Project Demonstrates:**

This project showcases comprehensive full-stack development skills with modern best practices:

### Technical Proficiency
- **Modern React**: Hooks, context, error boundaries, concurrent features
- **TypeScript Mastery**: Strict types, generic utilities, type-safe API layer
- **State Management**: Complex Zustand stores with persistence and middleware
- **Database Design**: Normalized schema with RLS policies, indexes, and triggers
- **Security Expertise**: Multi-layer security model, XSS prevention, session management

### Software Engineering Practices
- **Test-Driven Development**: 340+ E2E tests with visual regression and accessibility checks
- **Documentation Excellence**: Comprehensive guides enabled 45-minute database recovery
- **CI/CD**: Automated deployment with GitHub Actions
- **Code Quality**: ESLint, TypeScript strict mode, consistent patterns
- **Error Handling**: Graceful degradation with multiple error boundary layers

### Problem-Solving Under Pressure
See [Database Recovery Story](DATABASE_RECOVERY.md) for a real-world example of disaster recovery:
- **Challenge**: Complete database deletion
- **Solution**: Full recovery in 45 minutes using comprehensive migration documentation
- **Outcome**: Zero data loss (development environment), improved disaster recovery procedures
- **Lessons**: Documentation quality, idempotent migrations, verification scripts

This demonstrates not just technical skill, but:
- Ability to design robust systems that can recover from catastrophic failure
- Commitment to documentation as operational insurance
- Methodical problem-solving under time pressure
- Proactive improvement of processes based on lessons learned

### Architecture Highlights
- **Singleton Patterns**: HMR-safe auth initialization preventing duplicate listeners
- **Concurrency Control**: Ref-based guards for React StrictMode double-mounting
- **Performance Optimization**: Static-first loading, optimistic UI updates, lazy loading
- **Accessibility First**: WCAG 2.1 AA compliance, semantic HTML, keyboard navigation
- **Security Defense in Depth**: RLS + sanitization + validation + error boundaries

**Technologies**: React 19, TypeScript 5.8, Supabase, PostgreSQL, Playwright, Tailwind CSS 4.1, Zustand, React Hook Form, Zod

**Test Coverage**: 340+ E2E tests, 100% authentication security pass rate, accessibility audits

**Code Quality**: TypeScript strict mode, ESLint, comprehensive error boundaries, type-safe API layer

---

<!-- TODO: Add screenshots here
Recommended screenshots:
1. Homepage with hero section (shows pink floral design)
2. Dashboard with writing stats and recent entries
3. Calendar view with entry indicators
4. Journal entry editor with mood selector
5. Search interface with advanced filters
6. Trash bin with recovery countdown
7. All entries page with bulk operations

Screenshots should be placed in a new `/docs/screenshots/` directory
and embedded here with:
![Dashboard Screenshot](docs/screenshots/dashboard.png)
-->

---

**Built with ❤️ for women who write**
