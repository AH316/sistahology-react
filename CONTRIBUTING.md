# Contributing to Sistahology

Thank you for your interest in contributing to Sistahology! This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/sistahology-react.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see README.md)
5. Run the development server: `npm run dev`

## Code Quality Standards

### TypeScript
- All code must be written in TypeScript
- Enable strict mode
- No `any` types without justification
- Proper type definitions for all functions

### Testing
- Write E2E tests for new features using Playwright
- Ensure all tests pass before submitting PR: `npm run test:regression`
- Maintain or improve test coverage

### Accessibility
- Follow WCAG 2.1 AA guidelines
- Test with keyboard navigation
- Include ARIA labels where appropriate
- Maintain color contrast ratios >= 4.5:1

### Code Style
- Use ESLint configuration provided
- Run `npm run lint` before committing
- Follow existing code patterns and conventions

## Commit Message Format

Use conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat(journal): add mood tracking to entries`
- `fix(auth): resolve session timeout issue`
- `docs(readme): update installation instructions`

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes with clear, atomic commits
3. Write or update tests as needed
4. Run the full test suite: `npm run test:e2e`
5. Update documentation if needed
6. Push to your fork and create a Pull Request
7. Describe your changes clearly in the PR description
8. Link any related issues

## Testing Checklist

Before submitting a PR, verify:

- [ ] All existing tests pass
- [ ] New features have test coverage
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] Accessibility requirements met
- [ ] Documentation updated if needed
- [ ] Commit messages follow format

## Code Review

All PRs require:
- Passing CI checks
- Code review approval
- No merge conflicts with main branch

## Questions or Issues?

- Open an issue for bugs or feature requests
- Tag issues appropriately (bug, enhancement, documentation, etc.)
- Provide clear reproduction steps for bugs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
