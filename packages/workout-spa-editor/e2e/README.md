# E2E Tests with Playwright

This directory contains end-to-end tests for the Workout SPA Editor using Playwright.

## Overview

The E2E tests validate critical user flows and ensure the application works correctly across different browsers and devices.

## Test Coverage

### Critical Paths

1. **Workout Load, Edit, and Save** (`workout-load-edit-save.spec.ts`)
   - Load existing KRD file
   - View workout structure
   - Edit workout steps
   - Save modified workout
   - Validate file format errors
   - Handle parsing errors

2. **Workout Creation** (`workout-creation.spec.ts`)
   - Create new workout from scratch
   - Add multiple steps
   - Configure step properties
   - View workout statistics
   - Validate input fields
   - Undo/redo functionality

3. **Mobile Responsiveness** (`mobile-responsive.spec.ts`)
   - Mobile-optimized layout
   - Touch interactions
   - Smooth scrolling
   - Tablet layout adaptation

4. **Accessibility** (`accessibility.spec.ts`)
   - Keyboard navigation
   - ARIA labels and roles
   - Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
   - Focus indicators
   - Color contrast

## Running Tests

### Prerequisites

Install Playwright browsers:

```bash
pnpm test:e2e:install
```

### Run All Tests

```bash
pnpm test:e2e
```

### Run Tests in UI Mode

```bash
pnpm test:e2e:ui
```

### Run Tests in Debug Mode

```bash
pnpm test:e2e:debug
```

### Run Specific Test File

```bash
pnpm test:e2e workout-load-edit-save.spec.ts
```

### Run Tests for Specific Browser

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Run Mobile Tests

```bash
pnpm test:e2e --project="Mobile Chrome"
pnpm test:e2e --project="Mobile Safari"
```

### View Test Report

```bash
pnpm test:e2e:report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Test Directory**: `./e2e`
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Devices**: Pixel 5, iPhone 12
- **Retries**: 2 in CI, 0 locally
- **Trace**: On first retry
- **Screenshots**: On failure only

## CI/CD Integration

E2E tests run automatically in GitHub Actions:

- **Workflow**: `.github/workflows/workout-spa-editor-e2e.yml`
- **Triggers**: Push to main/develop, PRs
- **Matrix**: All browsers + mobile devices
- **Artifacts**: Test reports and screenshots (7-day retention)

## Writing New Tests

### Test Structure

Follow the AAA (Arrange-Act-Assert) pattern:

```typescript
test("should do something", async ({ page }) => {
  // Arrange
  await page.goto("/");

  // Act
  await page.getByRole("button", { name: /click me/i }).click();

  // Assert
  await expect(page.getByText("Success")).toBeVisible();
});
```

### Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements**: Use `await expect(...).toBeVisible()` instead of arbitrary waits
3. **Test user behavior**: Focus on what users see and do, not implementation details
4. **Keep tests independent**: Each test should be able to run in isolation
5. **Use descriptive names**: Test names should clearly describe what they verify
6. **Add comments**: Document requirements covered by each test file

### Selectors Priority

1. `getByRole()` - Best for accessibility
2. `getByLabel()` - Good for form inputs
3. `getByText()` - Good for content
4. `getByTestId()` - Last resort

## Debugging

### Debug Mode

Run tests in debug mode to step through:

```bash
pnpm test:e2e:debug
```

### Headed Mode

See the browser while tests run:

```bash
pnpm test:e2e --headed
```

### Slow Motion

Slow down test execution:

```bash
pnpm test:e2e --slow-mo=1000
```

### Trace Viewer

View traces for failed tests:

```bash
pnpm test:e2e:report
```

## Requirements Coverage

The E2E tests cover the following requirements:

- **Requirement 1**: View workout structure
- **Requirement 2**: Create new workout
- **Requirement 3**: Edit workout steps
- **Requirement 6**: Save workout as KRD
- **Requirement 7**: Load existing KRD file
- **Requirement 8**: Mobile-first responsive design
- **Requirement 9**: View workout statistics
- **Requirement 15**: Undo/redo functionality
- **Requirement 29**: Keyboard shortcuts
- **Requirement 35**: Accessibility compliance
- **Requirement 36**: Error handling

## Troubleshooting

### Tests timeout

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000, // 10 seconds
}
```

### Browser not found

Install browsers:

```bash
pnpm test:e2e:install
```

### Port already in use

Change port in `playwright.config.ts`:

```typescript
webServer: {
  url: "http://localhost:5174",
}
```

And update Vite config accordingly.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

## Test-Driven Development (TDD)

These E2E tests follow TDD principles - they are written **before** the features are implemented. This means:

1. **Tests define expected behavior** - They document what the application should do
2. **Tests will fail initially** - This is expected until features are implemented
3. **Tests guide implementation** - Use failing tests to know what to build next
4. **Tests verify completion** - When tests pass, features are complete

### Current Implementation Status

As of the initial E2E setup, most tests will fail because the application is still being built. This is **normal and expected** for TDD.

**Passing Tests** (Infrastructure working):

- Basic page navigation
- Focus indicators

**Pending Tests** (Waiting for implementation):

- Workout creation flow
- File loading and saving
- Step editing
- Mobile responsiveness
- Keyboard shortcuts
- ARIA labels

### Using Tests to Guide Development

1. **Pick a failing test** - Choose one test to focus on
2. **Implement the feature** - Build the UI and logic to make it pass
3. **Run the test** - Verify it passes
4. **Refactor** - Improve code while keeping tests green
5. **Repeat** - Move to the next failing test

Example workflow:

```bash
# Run a specific test to see what's needed
pnpm test:e2e workout-creation.spec.ts --project=chromium

# Implement the feature...

# Re-run to verify
pnpm test:e2e workout-creation.spec.ts --project=chromium

# When it passes, move to the next test
```

This approach ensures:

- All requirements are tested
- No features are forgotten
- Implementation matches specifications
- Regression is prevented
