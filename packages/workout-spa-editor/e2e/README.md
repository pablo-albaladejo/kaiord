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
   - Keyboard shortcuts:
     - Ctrl+Z / Cmd+Z: Undo
     - Ctrl+Y / Cmd+Y: Redo
     - Ctrl+S / Cmd+S: Save
     - Alt+Up: Move step up
     - Alt+Down: Move step down
   - Focus indicators
   - Color contrast

5. **Mobile Touch Drag** (`mobile-touch-drag.spec.ts`)
   - Touch drag reordering using Playwright's touchscreen API
   - Cross-device compatibility (iPhone 12, Pixel 5)
   - Data integrity preservation during touch drag
   - Touch gesture validation on mobile viewports

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

## Mobile Touch Drag Testing

The mobile touch drag tests validate touch gesture functionality on mobile devices using Playwright's touchscreen API.

### Overview

Mobile touch drag tests ensure that drag-and-drop functionality works correctly with actual touch gestures on mobile devices, not just keyboard shortcuts. These tests use Playwright's `page.touchscreen` API to simulate real touch interactions.

### Test Coverage

**Basic Touch Drag** (`mobile-touch-drag.spec.ts`):

- Touch drag reordering of workout steps
- Data integrity preservation (duration, power values)
- Sequential stepIndex validation after reorder
- Cross-device compatibility (iOS Safari, Android Chrome)

**Requirements Validated**:

- Requirement 1: Touch Drag Implementation
- Requirement 2: Touch Gesture Validation
- Requirement 5: Cross-Device Compatibility

### Running Mobile Touch Tests

```bash
# Run all mobile touch tests
pnpm test:e2e mobile-touch-drag.spec.ts

# Run on specific mobile project
pnpm test:e2e mobile-touch-drag.spec.ts --project="Mobile Chrome"
pnpm test:e2e mobile-touch-drag.spec.ts --project="Mobile Safari"

# Run with UI mode for debugging
pnpm test:e2e mobile-touch-drag.spec.ts --ui

# Run in headed mode to see browser
pnpm test:e2e mobile-touch-drag.spec.ts --headed
```

### Test Utilities

Located in `e2e/test-utils/`:

#### Touch Drag Helpers

**`touchDrag(page, source, target, options?)`**

- Performs smooth touch drag gesture using Playwright's touchscreen API
- Interpolates touch points for realistic movement
- Configurable duration and steps

**`touchDragNative(page, source, target, options?)`**

- Performs touch drag using native touch events (touchstart, touchmove, touchend)
- Alternative implementation for testing different touch behaviors
- Useful for debugging touch-specific issues

**`verifyStepOrder(page, expectedOrder)`**

- Validates workout step order by checking data attributes
- Verifies duration and power values match expected order
- Ensures data integrity after drag operations

**`verifyVisualFeedback(page, element, expectedClasses)`**

- Validates visual feedback during drag operations
- Checks for drag-active CSS classes
- Verifies drag preview styling

**`measureDragPerformance(page, source, target)`**

- Measures touch drag operation duration
- Returns timing in milliseconds
- Useful for performance validation (< 500ms target)

#### Viewport Configuration

**`MOBILE_DEVICES`** - Array of mobile device configurations:

- iPhone 12 (iOS Safari, WebKit)
- Pixel 5 (Android Chrome, Chromium)
- iPhone SE (compact screen)
- iPhone 14 Pro Max (large screen)
- Galaxy S21 (Android)
- iPad Mini (tablet)

**`getMobileViewport(deviceName)`**

- Returns viewport configuration for specified device
- Includes screen dimensions and touch support

### Writing Mobile Touch Tests

#### Basic Structure

```typescript
import { test, expect } from "@playwright/test";
import { touchDrag, verifyStepOrder } from "./test-utils";

test("should reorder steps with touch drag", async ({ page }) => {
  // Arrange
  await page.goto("/");
  const stepCards = page.locator('[data-testid="step-card"]');

  const originalOrder = [
    { duration: 300, power: 200 },
    { duration: 360, power: 210 },
    { duration: 420, power: 220 },
  ];

  await verifyStepOrder(page, originalOrder);

  // Act
  await touchDrag(page, stepCards.nth(0), stepCards.nth(1));

  // Assert
  const expectedOrder = [
    { duration: 360, power: 210 },
    { duration: 300, power: 200 },
    { duration: 420, power: 220 },
  ];

  await verifyStepOrder(page, expectedOrder);
});
```

#### Cross-Device Testing

```typescript
import { MOBILE_DEVICES } from "./test-utils/viewport-configs";

for (const device of MOBILE_DEVICES) {
  test.describe(`${device.name} - Touch Drag`, () => {
    test.use({ ...device.viewport });

    test("should work on this device", async ({ page }) => {
      // Test implementation
    });
  });
}
```

### Best Practices

1. **Use actual touch gestures** - Always use `touchDrag()` helper, not keyboard shortcuts
2. **Verify data integrity** - Check that step data (duration, power) is preserved after drag
3. **Test on multiple devices** - Validate on both iOS (WebKit) and Android (Chromium)
4. **Use deterministic waits** - Avoid arbitrary timeouts, use `waitForSelector` with stable state
5. **Validate visual feedback** - Check for drag-active classes and drag preview styling
6. **Measure performance** - Ensure operations complete within 500ms budget

### Troubleshooting

#### Touch drag not working

**Problem**: Touch gestures don't trigger drag operation

**Solutions**:

- Ensure `hasTouch: true` in viewport config
- Verify element is visible: `await element.scrollIntoViewIfNeeded()`
- Check that element has proper touch event handlers
- Try using `touchDragNative()` as alternative implementation

#### Flaky tests

**Problem**: Tests pass sometimes but fail intermittently

**Solutions**:

- Use deterministic waits: `await page.waitForSelector('[data-testid="step-card"]', { state: "stable" })`
- Avoid arbitrary timeouts like `page.waitForTimeout()`
- Ensure elements are fully loaded before interacting
- Add explicit waits for animations to complete

#### Elements not found

**Problem**: Selectors don't match elements

**Solutions**:

- Verify data-testid attributes are present in components
- Use `page.locator('[data-testid="step-card"]').count()` to debug
- Check that elements are rendered in mobile viewport
- Ensure viewport configuration matches test expectations

#### Performance issues

**Problem**: Touch drag operations are slow

**Solutions**:

- Reduce interpolation steps in `touchDrag()` options
- Check for unnecessary animations or transitions
- Verify no network requests blocking UI
- Use `measureDragPerformance()` to identify bottlenecks

### CI/CD Integration

Mobile touch drag tests run automatically in CI:

**Workflow**: `.github/workflows/workout-spa-editor-e2e.yml`

**Mobile Job Configuration**:

```yaml
e2e-mobile:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      project: ["Mobile Chrome", "Mobile Safari"]
```

**Artifacts**:

- Test results uploaded for 7 days
- Screenshots on failure
- Trace files for debugging

### Requirements Coverage

Mobile touch drag tests validate:

- **Requirement 1**: Touch Drag Implementation
  - Tests: Basic touch drag reordering
  - Validates: Touch gestures trigger drag operations

- **Requirement 2**: Touch Gesture Validation
  - Tests: Data integrity preservation
  - Validates: Step data unchanged after drag

- **Requirement 5**: Cross-Device Compatibility
  - Tests: iPhone 12 and Pixel 5 test suites
  - Validates: Works on iOS Safari (WebKit) and Android Chrome (Chromium)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Touchscreen API](https://playwright.dev/docs/api/class-touchscreen)

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

## Flakiness Measurement

### Overview

Flakiness rate measures how often tests fail intermittently without code changes. A flakiness rate below 5% is considered acceptable for E2E tests.

**Target**: < 5% flakiness rate over 100 runs

### Quick Start

```bash
# Quick validation (10 runs)
pnpm test:e2e:flakiness:quick

# Full measurement (100 runs)
pnpm test:e2e:flakiness

# iOS testing (Mobile Safari)
pnpm test:e2e:flakiness:ios
```

### What Gets Measured

The flakiness measurement script:

- Runs mobile touch drag tests multiple times
- Tracks pass/fail statistics
- Calculates flakiness rate percentage
- Generates detailed JSON results
- Saves individual run logs for debugging

### Results Interpretation

**Example Output**:

```
==========================================
Mobile Touch Drag Test Flakiness Analysis
==========================================

Test file:    mobile-touch-drag.spec.ts
Project:      Mobile Chrome
Iterations:   100
Target:       < 5% flakiness rate

Progress: [██████████████████████████████] 100% (100/100) | ✓ 96 | ✗ 4 | Pass rate: 96.0%

==========================================
Results Summary
==========================================

Total runs:       100
Passed:           96
Failed:           4
Flakiness rate:   4.00%

✓ Flakiness rate is below 5% target
```

### Understanding Results

**Results Files**:

- `flakiness-results.json` - Detailed statistics in JSON format
- `flakiness-logs/run-N.log` - Individual test run logs

**Analyzing Failures**:

```bash
# View specific failure
cat flakiness-logs/run-23.log

# Find common errors
grep "Error:" flakiness-logs/*.log | sort | uniq -c

# Identify flaky tests
grep "✘" flakiness-logs/*.log | cut -d'›' -f3 | sort | uniq -c
```

### Current State

**Known Issue**: Touch drag tests using Playwright's `touchscreen` API show high flakiness due to E2E framework limitations.

**Solution**: The test suite uses a hybrid approach:

- **Keyboard shortcut tests** - 100% reliable for E2E automation
- **Touch gesture tests** - Validated through manual testing and component tests

Both test the same underlying reordering logic, ensuring comprehensive coverage.

### Documentation

For complete documentation on flakiness measurement:

- [FLAKINESS-TESTING.md](./FLAKINESS-TESTING.md) - Complete usage guide
- [FLAKINESS-RESULTS.md](./FLAKINESS-RESULTS.md) - Analysis and recommendations
- [FLAKINESS-SUMMARY.md](./FLAKINESS-SUMMARY.md) - Implementation summary

### Custom Runs

```bash
# 50 runs on Mobile Chrome
node scripts/measure-flakiness.js 50 "Mobile Chrome"

# 200 runs on Mobile Safari
node scripts/measure-flakiness.js 200 "Mobile Safari"
```

### CI/CD Integration

The flakiness measurement can be integrated into CI/CD for continuous monitoring:

```yaml
# Example GitHub Actions workflow
- name: Measure E2E Flakiness
  run: pnpm --filter @kaiord/workout-spa-editor test:e2e:flakiness

- name: Upload Results
  uses: actions/upload-artifact@v4
  with:
    name: flakiness-results
    path: |
      packages/workout-spa-editor/flakiness-results.json
      packages/workout-spa-editor/flakiness-logs/
```

### Best Practices

1. **Run regularly** - Weekly or after significant changes
2. **Investigate all failures** - Even if flakiness rate is below 5%
3. **Keep logs** - Archive results for historical comparison
4. **Test on multiple devices** - Run on both Mobile Chrome and Mobile Safari
5. **Monitor trends** - Track flakiness rate over time
