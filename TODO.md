# TODO.md - Sistahology Development Backlog

## Now (Priority 1-3)

- [ ] **Hero Content Polish** - Owner: `react-frontend-shipper`
  - Remove dev-only Supabase integration test from production
  - Ensure pink accent classes properly render in CMS content
  - Validate fallback content shows when DB unavailable
  - *Acceptance: Hero loads smoothly with proper styling in all scenarios*

- [ ] **Journal Save Button Logic** - Owner: `react-frontend-shipper`
  - Fix save button enable/disable state based on content + journal selection
  - Add validation for empty content before save
  - Show proper error messages for missing journal selection
  - *Acceptance: Save button only enabled when valid journal selected and content exists*

- [ ] **Journal Dropdown Wiring** - Owner: `react-frontend-shipper`
  - Debug journal selection state management in NewEntryPage
  - Ensure dropdown properly syncs with Zustand store
  - Fix initial journal auto-selection on first load
  - *Acceptance: Journal dropdown works reliably with proper state sync*

## Next (Priority 4-7)

- [ ] **Admin Pages UX** - Owner: `react-frontend-shipper`
  - Create admin dashboard for CMS content management
  - Add page editor for home/about/contact content
  - Implement role-based access control
  - *Acceptance: Admins can edit page content through UI*

- [ ] **Entry Search Performance** - Owner: `db-rls-guardian`
  - Add full-text search indexes on entry.content
  - Optimize search queries with proper pagination
  - Implement search result highlighting
  - *Acceptance: Search returns results in <500ms for 1000+ entries*

- [ ] **Calendar View Enhancement** - Owner: `react-frontend-shipper`
  - Add month/week/day view toggles
  - Implement entry preview on hover
  - Add quick entry creation from calendar
  - *Acceptance: Calendar provides intuitive entry navigation*

## Later (Priority 8-10)

- [ ] **Blog CMS Integration** - Owner: `react-frontend-shipper`
  - Migrate static blog posts to Supabase
  - Create blog post editor with rich text
  - Add blog categories and tags
  - *Acceptance: Blog posts managed through database*

- [ ] **Export/Import Features** - Owner: `react-frontend-shipper`
  - Add journal export to PDF/Markdown
  - Implement entry backup to JSON
  - Create import from other journaling apps
  - *Acceptance: Users can export/import their journal data*

- [ ] **PWA Support** - Owner: `release-captain`
  - Add service worker for offline support
  - Implement push notifications for reminders
  - Create app manifest for installability
  - *Acceptance: App works offline and is installable*

- [ ] **E2E Test Coverage** - Owner: `playwright-qa-lead`
  - Write Playwright tests for critical user flows
  - Add visual regression tests for UI components
  - Implement performance benchmarks
  - *Acceptance: 80% coverage of critical paths with <5s test execution*

---

## Agent Responsibilities

- **`react-frontend-shipper`**: Frontend features, UI/UX, component development
- **`db-rls-guardian`**: Database optimization, RLS policies, data security
- **`playwright-qa-lead`**: Test automation, quality assurance
- **`release-captain`**: Build process, deployments, infrastructure
- **`docs-scribe`**: Documentation, API specs, user guides