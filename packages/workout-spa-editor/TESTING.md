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
