# Testing Infrastructure

This document describes the testing setup for the Workout SPA Editor.

## Overview

The project uses **Vitest** as the test runner with **React Testing Library** for component testing. The setup follows modern React testing best practices with full TypeScript support.

## Test Stack

- **Test Runner**: Vitest 3.2.4
- **Component Testing**: React Testing Library 16.3.0
- **User Interactions**: @testing-library/user-event 14.6.1
- **DOM Matchers**: @testing-library/jest-dom 6.9.1
- **Test Environment**: jsdom 27.2.0
- **Coverage Provider**: @vitest/coverage-v8 3.2.4

## Configuration

### Vitest Config (`vitest.config.ts`)

Key features:

- **Environment**: jsdom for DOM simulation
- **Globals**: Enabled for describe/it/expect without imports
- **CSS Support**: Enabled for component style testing
- **Path Aliases**: `@/` maps to `src/`
- **Setup Files**: Automatic test setup with jest-dom matchers
- **Coverage Thresholds**: 70% for lines, functions, branches, and statements

### Test Setup (`src/test-setup.ts`)

Automatically:

- Extends Vitest expect with jest-dom matchers
- Cleans up after each test to prevent memory leaks
- Runs before all tests

### Test Utilities (`src/test-utils.tsx`)

Provides:

- `renderWithProviders()`: Custom render function for future provider wrapping
- Re-exports all React Testing Library utilities
- Exports `userEvent` for user interaction simulation

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

## Coverage Configuration

Coverage is collected using V8 provider with the following settings:

**Reporters**: text, json, html, lcov

**Excluded from coverage**:

- node_modules/
- dist/
- Configuration files (_.config.ts, _.config.js)
- Test files (_.test.ts, _.test.tsx)
- Test utilities (test-setup.ts, test-utils.tsx)
- Type definitions (\*.d.ts, types/\*\*)
- Entry points (main.tsx)

**Thresholds**:

- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## Writing Tests

### Test File Location

Tests should be co-located with the component they test:

```
src/components/atoms/Button/
├── Button.tsx
├── Button.test.tsx
└── index.ts
```

### Test Structure

Follow the AAA (Arrange-Act-Assert) pattern:

```typescript
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import { Button } from "./Button";

describe("Button", () => {
  it("should call onClick when clicked", async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    // Act
    await user.click(screen.getByRole("button"));

    // Assert
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Best Practices

1. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test user behavior**: Focus on what users see and do, not implementation details
3. **Async operations**: Use `await` with user interactions and async queries
4. **Accessibility**: Tests should verify ARIA attributes and keyboard navigation
5. **Minimal mocking**: Only mock external dependencies, not internal logic

## Current Test Coverage

As of the initial setup:

- **Test Files**: 18
- **Total Tests**: 222 passing
- **Coverage**: 52.17% (target: 70%)

### Coverage by Area

- Store/State Management: 96.8%
- Type Guards & Validation: 100%
- Atoms (Button, Badge, Icon, Input, ErrorMessage): 90%+
- Molecules (FileUpload, StepCard, DurationPicker, TargetPicker): 60-70%
- Organisms (WorkoutList, StepEditor, WorkoutStats): 40-75%
- Pages (WelcomeSection, WorkoutSection): 75%

## Next Steps

To reach the 70% coverage threshold:

1. Add tests for untested utility functions
2. Increase coverage for formatting helpers
3. Add tests for edge cases in validation logic
4. Test error handling paths
5. Add integration tests for complete user flows

## Troubleshooting

### Tests fail with "act(...)" warnings

Wrap state updates in `act()` or use `waitFor()`:

```typescript
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Updated")).toBeInTheDocument();
});
```

### Coverage provider not found

Ensure `@vitest/coverage-v8` version matches `vitest` version:

```bash
pnpm add -D @vitest/coverage-v8@3.2.4
```

### Tests timeout

Increase timeout in vitest.config.ts:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## E2E Testing with Playwright

The project includes end-to-end tests using Playwright to validate critical user flows across different browsers and devices.

### E2E Test Stack

- **Test Runner**: Playwright 1.56+
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Configuration**: `playwright.config.ts`

### Running E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm test:e2e:install

# Run all E2E tests
pnpm test:e2e

# Run tests in UI mode (interactive)
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report

# Run specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit

# Run mobile tests
pnpm test:e2e --project="Mobile Chrome"
pnpm test:e2e --project="Mobile Safari"
```

### E2E Test Coverage

The E2E tests validate the following critical paths:

1. **Workout Load, Edit, and Save**
   - Load existing KRD file
   - View workout structure
   - Edit workout steps
   - Save modified workout
   - Validate file format errors

2. **Workout Creation**
   - Create new workout from scratch
   - Add multiple steps
   - Configure step properties
   - View workout statistics
   - Input validation

3. **Mobile Responsiveness**
   - Mobile-optimized layout
   - Touch interactions
   - Smooth scrolling
   - Tablet adaptation

4. **Accessibility**
   - Keyboard navigation
   - ARIA labels and roles
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
   - Focus indicators

### E2E Test Files

All E2E tests are located in the `e2e/` directory:

- `workout-load-edit-save.spec.ts` - File loading and editing flow
- `workout-creation.spec.ts` - Workout creation flow
- `mobile-responsive.spec.ts` - Mobile and tablet responsiveness
- `accessibility.spec.ts` - Accessibility and keyboard navigation

See `e2e/README.md` for detailed documentation.

### CI/CD Integration

E2E tests run automatically in GitHub Actions:

- **Workflow**: `.github/workflows/workout-spa-editor-e2e.yml`
- **Triggers**: Push to main/develop, pull requests
- **Matrix**: All browsers + mobile devices
- **Artifacts**: Test reports and screenshots (7-day retention)

### Writing E2E Tests

Follow these best practices:

1. Use semantic selectors (`getByRole`, `getByLabel`, `getByText`)
2. Wait for elements with `await expect(...).toBeVisible()`
3. Test user behavior, not implementation details
4. Keep tests independent and isolated
5. Add comments documenting requirements covered

Example:

```typescript
test("should load and edit workout", async ({ page }) => {
  // Arrange
  await page.goto("/");

  // Act
  await page.getByRole("button", { name: /load workout/i }).click();

  // Assert
  await expect(page.getByText("Workout loaded")).toBeVisible();
});
```

### Debugging E2E Tests

```bash
# Run in headed mode (see browser)
pnpm test:e2e --headed

# Slow down execution
pnpm test:e2e --slow-mo=1000

# Debug specific test
pnpm test:e2e:debug workout-load-edit-save.spec.ts
```
