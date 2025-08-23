# QA Summary: Playwright Homepage Hero Tests

## Test Coverage Overview

The Playwright test suite validates the hero header functionality on the Sistahology React application homepage with the following coverage:

### Core Requirements Validation ✅
- **Semantic HTML Structure**: Validates exactly one `<h1>` element exists in the document
- **Decorative Header**: Confirms the decorative "WELCOME" header is present with proper accessibility attributes (`aria-hidden="true"`)
- **Visual Regression**: Captures screenshots at three responsive breakpoints for visual testing
- **Error Handling**: Fails tests on console errors or HTTP 4xx/5xx responses

### Test Specifications

#### 1. Header Structure & Screenshots (`should validate hero header structure and capture responsive screenshots`)
- Navigates to homepage (`/`)
- Waits for content loading (handles both DB content and fallback scenarios)
- Asserts exactly one semantic `<h1>` element exists
- Verifies decorative "WELCOME" header is visible and contains expected text
- Captures screenshots at multiple viewport sizes:
  - **Mobile**: 390px × 844px → `test/artifacts/screens/home-390.png`
  - **Tablet**: 768px × 1024px → `test/artifacts/screens/home-768.png`
  - **Desktop**: 1280px × 720px → `test/artifacts/screens/home-1280.png`
- Validates semantic `<h1>` has meaningful content (>10 characters)

#### 2. Loading State Handling (`should handle loading states gracefully`)
- Tests graceful handling of loading states
- Ensures content resolution without getting stuck in loading spinner
- Validates final rendered state includes both semantic and decorative headers

#### 3. Accessibility Compliance (`should maintain accessibility with proper heading hierarchy`)
- Verifies proper heading hierarchy starts with `<h1>`
- Confirms decorative "WELCOME" header is properly marked with `aria-hidden="true"`
- Validates exactly one visible, semantic `<h1>` element exists
- Ensures decorative elements don't interfere with screen reader navigation

### Cross-Browser & Device Testing

Tests run across multiple browsers and devices:
- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Browsers**: Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)

## What's Being Validated

### Functional Requirements
1. **Single Semantic Heading**: Ensures accessibility compliance with exactly one `<h1>` per page
2. **Decorative Elements**: Validates visual branding elements are properly hidden from screen readers
3. **Content Loading**: Handles dynamic content loading from database or fallback to static content
4. **Responsive Design**: Confirms layout works across mobile, tablet, and desktop viewports

### Technical Validation
- **Network Health**: Fails on HTTP errors (4xx/5xx responses)
- **Console Cleanliness**: Fails on JavaScript console errors
- **Accessibility Standards**: Proper ARIA attributes and heading hierarchy
- **Visual Consistency**: Screenshot-based regression testing

## How to Run the Tests

### Prerequisites
```bash
# Install Playwright browsers (one-time setup)
npm run test:install
```

### Test Execution Commands

```bash
# Run all E2E tests
npm run test:e2e

# Open Playwright UI for interactive testing and debugging
npm run test:e2e:ui

# Update homepage screenshots (useful for visual regression updates)
npm run snap:home
```

### Development Server
Tests automatically start the Vite development server at `http://localhost:5173`. The test configuration handles server startup and shutdown automatically.

## Expected Artifacts Location

All test artifacts are organized under `/test/artifacts/`:

### Screenshots (Visual Regression Testing)
```
test/artifacts/screens/
├── home-390.png   # Mobile viewport
├── home-768.png   # Tablet viewport  
└── home-1280.png  # Desktop viewport
```

### Test Results & Debugging
```
test/artifacts/
├── playwright-report/     # HTML test report
├── test-results.json     # JSON test results
└── test-results/         # Individual test artifacts
    ├── screenshots/      # Failure screenshots
    ├── videos/          # Test execution videos
    └── traces/          # Playwright traces for debugging
```

### Viewing Test Results
- **HTML Report**: Generated automatically and served at `http://localhost:9323` after test runs
- **Screenshots**: Viewable directly as PNG files for visual validation
- **Traces**: Use `npx playwright show-trace [trace-file]` for detailed debugging

## Integration with CI/CD

The test configuration is CI-ready with:
- **Retry Logic**: 2 retries on CI environments
- **Parallel Execution**: Disabled on CI for stability
- **Artifact Retention**: All debugging artifacts saved on failures
- **Exit Codes**: Proper exit codes for CI pipeline integration

## Maintenance Notes

- **Visual Updates**: Run `npm run snap:home` when hero design changes to update baseline screenshots
- **Content Updates**: Tests handle dynamic content from CMS, no updates needed for content changes
- **Accessibility**: Tests will catch accessibility regressions in heading hierarchy or ARIA attributes
- **Performance**: Tests include timeouts and loading state handling for reliable execution