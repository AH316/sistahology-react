# Testing Strategy

**Last Updated**: January 2025
**Status**: Partial coverage - expanding test suite

---

## Current Test Coverage

### ✅ Implemented Tests

**Homepage & Visual Regression**
- Homepage hero snapshot tests
- Visual regression for hero layout changes
- Accessibility tests for homepage elements

**Journal Flow Tests** (5/11 passing)
- Basic journal creation
- Entry creation workflow
- Journal selection validation
- *Note: Some tests need updates for new features*

**Authentication & Security**
- Login/logout flows
- Protected route guards
- Session recovery mechanisms
- Auth timeout protection

**UI Components**
- Toast notification system
- Toast de-duplication logic
- Modal confirmation dialogs

**Regression Suite**
- Core functionality verification
- Auth state management
- Loading state handling

---

## ❌ Missing Test Coverage

### High Priority (Critical Gaps)

**Trash Bin Functionality**
- [ ] Soft delete operation (move to trash)
- [ ] Single entry recovery
- [ ] Bulk entry recovery
- [ ] Permanent delete with confirmation
- [ ] Auto-cleanup of 30+ day old entries
- [ ] Days remaining countdown display
- [ ] Warning indicators for expiring entries

**Bulk Operations**
- [ ] Bulk delete across multiple journals
- [ ] Bulk select all/deselect all
- [ ] Bulk operation state management
- [ ] Concurrent bulk operations
- [ ] Error handling during bulk ops

**Archive System**
- [ ] Archive single entry
- [ ] Restore archived entry
- [ ] Bulk archive operations
- [ ] Filter archived vs active entries
- [ ] Archive state persistence

**AllEntriesPage**
- [ ] Search functionality
- [ ] Filter by journal
- [ ] Sort by date/journal/word count
- [ ] Multi-select with checkboxes
- [ ] Bulk delete from all entries view
- [ ] Cross-journal operations

### Medium Priority (Important Features)

**Calendar Functionality**
- [ ] Quick entry modal
- [ ] Date-based entry creation
- [ ] Entry indicators on calendar
- [ ] Navigation between months
- [ ] Multiple entries per day handling

**Entry Editing**
- [ ] Edit entry content
- [ ] Save changes workflow
- [ ] Cancel without saving
- [ ] Delete from edit page
- [ ] Validation on save

**Search Functionality**
- [ ] Full-text search across entries
- [ ] Search result accuracy
- [ ] Filter by journal in search
- [ ] Search performance with large datasets

**Dashboard**
- [ ] Stats calculation accuracy
- [ ] Writing streak logic
- [ ] Recent entries display
- [ ] Widget data accuracy

### Low Priority (Edge Cases)

**Error Handling**
- [ ] Network failure recovery
- [ ] Database timeout handling
- [ ] Concurrent edit conflicts
- [ ] Invalid data handling

**Accessibility**
- [ ] Keyboard navigation for new pages
- [ ] Screen reader compatibility
- [ ] Focus management in modals
- [ ] ARIA labels verification

**Performance**
- [ ] Large dataset handling (1000+ entries)
- [ ] Search performance benchmarks
- [ ] Bulk operation performance
- [ ] Loading state responsiveness

---

## Manual Testing Status

### ✅ Confirmed Working (Manual Tests)

**Trash Bin**
- Soft delete moves entries to trash correctly
- Single entry recovery works
- Bulk entry recovery functions properly
- Permanent delete with confirmation
- Days remaining display accurate
- Auto-cleanup runs successfully

**Bulk Operations**
- Bulk delete across journals works
- Select all/deselect all functions
- Bulk recover restores multiple entries
- Error messages display correctly

**Archive System**
- Archive entry hides from main view
- Restore entry makes it active again
- Archive state persists across sessions
- Archived entries excluded from default views

**All Entries Page**
- Search filters entries correctly
- Journal filter works
- Sorting by all options functions
- Bulk delete from this view works
- Entry count displays accurately

---

## Testing Infrastructure

### Test Framework
- **E2E Testing**: Playwright
- **Test Runner**: Playwright Test Runner
- **Browser Coverage**: Chromium, Firefox, WebKit
- **Test Artifacts**: Screenshots, accessibility reports

### Test Configuration
- **Config File**: `playwright.config.ts`
- **Auth Setup**: `tests/global-setup.ts`
- **Auth Session**: `tests/.auth/user.json`
- **Artifacts Directory**: `tests/artifacts/`

### Test Projects
- **Unauthenticated**: Tests for public pages
- **Authenticated**: Tests for protected routes
- **Regression**: Core functionality tests tagged with `@regression`

---

## Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:journals

# Run regression tests only
npm run test:regression

# Run with UI mode for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/trash-bin.spec.ts

# Run tests with specific tag
npx playwright test --grep @regression

# Run authenticated tests only
npx playwright test --project=authUser

# Debug a failing test
npx playwright test --debug tests/bulk-operations.spec.ts

# Update snapshots
npm run snap:home
npm run snap:journal

# Generate accessibility reports
npx playwright test tests/accessibility.spec.ts
```

---

## Data Test IDs

Components use `data-testid` attributes for E2E testing:

**Homepage**
- `hero-card`, `hero-decor` - Hero elements

**Journal & Entry Forms**
- `journal-select` - Journal dropdown
- `journal-editor` - Entry content editor
- `save-entry` - Save button
- `empty-journal-state` - Empty state container
- `create-first-journal` - First journal creation

**All Entries Page**
- `search-entries` - Search input
- `filter-journal` - Journal filter dropdown
- `sort-entries` - Sort dropdown
- `select-all` - Select all checkbox
- `entry-card` - Individual entry card
- `entry-checkbox` - Entry selection checkbox
- `journal-badge` - Journal name badge

**Toast System**
- `toast-root` - Toast notification container

**Authentication**
- `login-form`, `register-form` - Auth forms

---

## Testing Priorities

### Phase 1: Core Functionality (Current)
1. **Trash bin operations**: Full coverage of soft delete and recovery
2. **Bulk operations**: Multi-select and batch processing
3. **Archive system**: Archive/restore workflows

### Phase 2: User Workflows
1. **Entry lifecycle**: Create → Edit → Archive → Delete → Recover
2. **Multi-journal workflows**: Cross-journal operations
3. **Calendar integration**: Date-based entry creation

### Phase 3: Edge Cases & Performance
1. **Large datasets**: Test with 1000+ entries
2. **Concurrent operations**: Race condition testing
3. **Network failures**: Offline/timeout scenarios

### Phase 4: Accessibility & Polish
1. **Keyboard navigation**: All pages and modals
2. **Screen readers**: ARIA labels and announcements
3. **Color contrast**: WCAG AA compliance verification

---

## Test Strategy Going Forward

### Goals
- **80% coverage** of critical user paths
- **Zero regressions** in core functionality
- **Sub-5 second** test execution time
- **Automated CI/CD** testing on all PRs

### Principles
1. **Test behavior, not implementation**: Focus on user interactions
2. **Prioritize happy paths first**: Then edge cases
3. **Realistic data**: Use production-like test data
4. **Isolated tests**: Each test should be independent
5. **Fast feedback**: Keep test suite under 60 seconds

### Testing Checklist for New Features
- [ ] Write E2E tests before merging
- [ ] Add data-testid attributes to key elements
- [ ] Test both success and error paths
- [ ] Verify accessibility (keyboard nav, ARIA)
- [ ] Check responsive behavior (mobile/desktop)
- [ ] Update test documentation

---

## Known Testing Gaps

### Test Data Management
- Need standardized test fixtures
- Cleanup strategies for test data
- Database seeding for consistent tests

### CI/CD Integration
- GitHub Actions workflow for E2E tests
- Automated test runs on PRs
- Test result reporting in CI

### Performance Benchmarks
- Need baseline metrics for search performance
- Bulk operation performance targets
- Loading time thresholds

---

## Contributing Tests

When adding new features:
1. Add `data-testid` attributes to interactive elements
2. Write E2E tests covering happy path and error cases
3. Update this document with new test coverage
4. Run full regression suite before merging
5. Ensure tests are deterministic and don't flake

---

## Test Maintenance

### Regular Tasks
- **Weekly**: Run full regression suite
- **Monthly**: Review and update test priorities
- **Quarterly**: Audit test coverage and remove obsolete tests

### Red Flags
- Tests that fail intermittently (flaky tests)
- Tests taking longer than 5 seconds each
- Tests with hardcoded wait times (use waitFor instead)
- Tests that depend on specific test order

---

**Current Focus**: Expanding E2E coverage for trash bin, bulk operations, and archive system. All new tests should follow Playwright best practices and use data-testid selectors.
