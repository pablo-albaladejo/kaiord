# Tasks: Mobile Touch Drag Testing

## Overview

Implementation tasks for adding comprehensive mobile touch drag testing to the Workout SPA Editor E2E test suite.

**Current Status:**

- ✅ Mobile viewport configuration exists in `playwright.config.ts` (Pixel 5, iPhone 12)
- ✅ Basic mobile touch test exists in `drag-drop-reordering.spec.ts` (uses keyboard shortcuts)
- ❌ No actual touch gesture testing (current test uses keyboard as workaround)
- ❌ No touch drag helper utilities
- ❌ No visual feedback validation for touch drag
- ❌ No performance testing for touch operations

## Task Breakdown

- [x] 1. Touch Drag Utilities
  - [x] 1.1 Create Touch Helper Utilities

**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Description:**
Create reusable touch drag helper functions for E2E tests that use Playwright's touchscreen API.

**Acceptance Criteria:**

- [x] Create `packages/workout-spa-editor/e2e/test-utils/` directory
- [-] Create `packages/workout-spa-editor/e2e/test-utils/touch-helpers.ts`
- [x] Implement `touchDrag()` function with smooth interpolation using `page.touchscreen` API
- [x] Implement `touchDragNative()` function with native touch events (touchstart, touchmove, touchend)
- [-] Implement `verifyStepOrder()` helper for data validation
- [x] Implement `measureDragPerformance()` helper for timing
- [x] Add JSDoc comments for all exported functions
- [-] Create `packages/workout-spa-editor/e2e/test-utils/index.ts` to export all helpers

**Implementation Notes:**

```typescript
// Key functions to implement:
- touchDrag(page, source, target, options?)
- touchDragNative(page, source, target, options?)
- verifyStepOrder(page, expectedOrder)
- measureDragPerformance(page, source, target)
- verifyDragPreview(page, draggedElement)
- verifyDropZone(page, targetPosition)
```

**Requirements:** Requirement 1 (Touch Drag Implementation), Requirement 2 (Touch Gesture Validation)

- [x] 1.2 Create Viewport Configuration Utilities

**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Description:**
Create viewport configuration utilities for easy reuse across tests. Note: Playwright config already has Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12) configured.

**Acceptance Criteria:**

- [-] Create `packages/workout-spa-editor/e2e/test-utils/viewport-configs.ts`
- [-] Export viewport presets that match Playwright's device configurations
- [-] Add additional viewport presets for iPhone SE, iPhone 14 Pro Max, Galaxy S21, iPad Mini
- [-] Export typed viewport configurations
- [-] Add JSDoc comments explaining each viewport and when to use it

**Implementation Notes:**

```typescript
// Match existing Playwright config devices
export const MOBILE_VIEWPORTS = {
  pixel5: { width: 393, height: 851, hasTouch: true }, // Matches "Mobile Chrome"
  iphone12: { width: 390, height: 844, hasTouch: true }, // Matches "Mobile Safari"
  iphoneSE: { width: 375, height: 667, hasTouch: true },
  iphone14ProMax: { width: 430, height: 932, hasTouch: true },
  galaxyS21: { width: 360, height: 800, hasTouch: true },
  iPadMini: { width: 768, height: 1024, hasTouch: true },
} as const;
```

**Requirements:** Requirement 5 (Cross-Device Compatibility)

- [x] 2. Basic Touch Drag Tests
  - [x] 2.1 Create Mobile Touch Drag Test File

**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.1

**Description:**
Create new E2E test file specifically for mobile touch drag functionality using actual touch gestures (not keyboard shortcuts).

**Acceptance Criteria:**

- [-] Create `packages/workout-spa-editor/e2e/mobile-touch-drag.spec.ts`
- [-] Import touch helpers from test-utils
- [x] Reuse `createTestWorkout()` helper from existing drag-drop-reordering.spec.ts
- [x] Add test setup with mobile viewport configuration
- [-] Add `beforeEach` hook to navigate to app
- [x] Follow AAA pattern (Arrange-Act-Assert) for all tests
- [x] Add descriptive test names and requirement comments

**Implementation Notes:**

```typescript
import { expect, test } from "@playwright/test";
import { touchDrag, verifyStepOrder } from "./test-utils/touch-helpers";

test.describe("Mobile Touch Drag", () => {
  // Use iPhone 12 viewport (matches Playwright's "Mobile Safari" project)
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // Tests go here
});
```

**Requirements:** Requirement 1 (Touch Drag Implementation), Requirement 2 (Touch Gesture Validation)

- [x] 2.2 Implement Basic Touch Drag Test

**Priority:** High  
**Estimated Time:** 4 hours  
**Dependencies:** Task 2.1

**Description:**
Implement test for basic touch drag reordering using Playwright's touchscreen API (not keyboard shortcuts).

**Acceptance Criteria:**

- [x] Test loads workout with 3 steps
- [x] Test verifies initial step order using data (duration, power)
- [x] Test performs touch drag using `touchDrag()` helper from position 0 to position 1
- [x] Test verifies step order changed correctly by checking data
- [x] Test verifies step data integrity (duration, power values preserved)
- [x] Test verifies stepIndex values are sequential after reorder
- [x] Test uses deterministic waits (no arbitrary timeouts)
- [x] Test covers Requirement 1 (Touch Drag Implementation)

**Implementation Notes:**

```typescript
test("should reorder steps using touch drag", async ({ page }) => {
  // Arrange
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "test-workout.krd",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(createTestWorkout(3))),
  });

  await expect(page.getByText("Test Workout")).toBeVisible();

  const stepCards = page.locator('[data-testid="step-card"]');
  await verifyStepOrder(page, [
    { duration: 300, power: 200 },
    { duration: 360, power: 210 },
    { duration: 420, power: 220 },
  ]);

  // Act - Use actual touch drag, not keyboard
  await touchDrag(page, stepCards.nth(0), stepCards.nth(1));

  // Assert
  await verifyStepOrder(page, [
    { duration: 360, power: 210 },
    { duration: 300, power: 200 },
    { duration: 420, power: 220 },
  ]);
});
```

**Requirements:** Requirement 1 (Touch Drag Implementation), Requirement 2 (Touch Gesture Validation)

- [x] 2.3 Add Cross-Viewport Touch Drag Tests

**Priority:** High  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.2

**Description:**
Add tests that run across multiple mobile viewports to ensure touch drag works on different devices.

**Acceptance Criteria:**

- [-] Create test suites for iPhone 12 (iOS Safari) and Pixel 5 (Android Chrome)
- [-] Each suite runs basic touch drag test
- [x] Tests verify touch drag works on WebKit browser (iOS Safari)
- [x] Tests verify touch drag works on Chromium browser (Android Chrome)
- [-] Tests use `test.use()` to configure viewport per suite
- [-] Tests cover Requirement 5 (Cross-Device Compatibility)

**Implementation Notes:**

```typescript
const MOBILE_DEVICES = [
  { name: "iPhone 12", viewport: { width: 390, height: 844 }, hasTouch: true },
  { name: "Pixel 5", viewport: { width: 393, height: 851 }, hasTouch: true },
];

for (const device of MOBILE_DEVICES) {
  test.describe(`Mobile Touch Drag - ${device.name}`, () => {
    test.use({ viewport: device.viewport, hasTouch: device.hasTouch });

    test("should support touch drag", async ({ page }) => {
      // ... test implementation ...
    });
  });
}
```

**Requirements:** Requirement 5 (Cross-Device Compatibility)

- [x] 3. Visual Feedback Tests
  - [x] 3.1 Add Drag Preview Styling Test

**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.2

**Description:**
Test that visual feedback is shown during touch drag operation. This validates that the DnD Kit touch sensor provides proper visual cues.

**Acceptance Criteria:**

- [ ] Test verifies drag preview has correct CSS classes during drag
- [ ] Test verifies drag overlay is visible during drag (if applicable)
- [ ] Test verifies opacity or other visual changes during drag
- [ ] Test verifies drag preview is removed after drop
- [ ] Test covers Requirement 3 (Visual Feedback Testing)

**Implementation Notes:**

```typescript
test("should show drag preview during touch drag", async ({ page }) => {
  // Arrange
  const stepCards = page.locator('[data-testid="step-card"]');
  const firstStep = stepCards.nth(0);

  // Act - Start drag using touch helper
  const sourceBox = await firstStep.boundingBox();
  if (!sourceBox) throw new Error("Could not get source position");

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;

  await page.touchscreen.tap(sourceX, sourceY);
  await page.waitForTimeout(150); // Long press threshold

  // Assert - Verify drag preview (check actual CSS classes used by DnD Kit)
  // Note: Actual class names may differ - inspect during implementation
  await expect(firstStep).toHaveClass(/dragging|drag-active/);

  // Complete drag
  await page.touchscreen.tap(sourceX, sourceY + 100);

  // Verify drag preview removed
  await expect(firstStep).not.toHaveClass(/dragging|drag-active/);
});
```

**Requirements:** Requirement 3 (Visual Feedback Testing)

- [x] 3.2 Add Drop Zone Indicator Test

**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 3.1

**Description:**
Test that drop zone indicators are shown during drag (if implemented in the UI).

**Acceptance Criteria:**

- [ ] Test verifies drop indicator appears at target position (if UI implements this)
- [ ] Test verifies drop indicator has correct styling
- [ ] Test verifies drop indicator is removed after drop
- [ ] Test covers Requirement 3 (Visual Feedback Testing)

**Implementation Notes:**

```typescript
test("should show drop zone indicator during drag", async ({ page }) => {
  // Arrange
  const stepCards = page.locator('[data-testid="step-card"]');

  // Act - Start drag and move over target
  // Note: This test may need to be adjusted based on actual UI implementation
  await touchDragStart(page, stepCards.nth(0));
  await touchDragMove(page, stepCards.nth(1));

  // Assert - Verify drop indicator (if implemented)
  const dropIndicator = page.locator('[data-testid="drop-indicator"]');
  await expect(dropIndicator).toBeVisible();

  // Complete drag
  await touchDragEnd(page, stepCards.nth(1));

  // Verify drop indicator removed
  await expect(dropIndicator).not.toBeVisible();
});
```

**Note:** This test may need to be skipped if drop zone indicators are not implemented in the UI.

**Requirements:** Requirement 3 (Visual Feedback Testing)

- [x] 4. Edge Cases
  - [x] 4.1 Add First/Last Step Edge Case Tests

**Priority:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.2

**Description:**
Test edge cases for dragging first and last steps using touch gestures. Note: Existing keyboard tests already cover this logic, but we need to verify it works with touch.

**Acceptance Criteria:**

- [ ] Test verifies first step can be dragged down using touch
- [ ] Test verifies first step cannot be dragged up (no-op) using touch
- [ ] Test verifies last step can be dragged up using touch
- [ ] Test verifies last step cannot be dragged down (no-op) using touch
- [ ] Test verifies step order unchanged for invalid drags
- [ ] Test covers Requirement 4 (Touch Drag Edge Cases)

**Implementation Notes:**

```typescript
test("should not move first step up with touch", async ({ page }) => {
  // Arrange
  const stepCards = page.locator('[data-testid="step-card"]');
  const originalOrder = [
    { duration: 300, power: 200 },
    { duration: 360, power: 210 },
    { duration: 420, power: 220 },
  ];

  await verifyStepOrder(page, originalOrder);

  // Act - Try to drag first step up (to itself or above)
  await touchDrag(page, stepCards.nth(0), stepCards.nth(0));

  // Assert - Verify order unchanged
  await verifyStepOrder(page, originalOrder);
});

test("should not move last step down with touch", async ({ page }) => {
  // Similar implementation for last step
});
```

**Requirements:** Requirement 4 (Touch Drag Edge Cases)

- [x] 4.2 Add Cancelled Drag Test

**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.2

**Description:**
Test that cancelled drag operations return step to original position when using touch gestures.

**Acceptance Criteria:**

- [ ] Test starts drag operation with touch
- [ ] Test moves finger slightly (< threshold distance)
- [ ] Test releases finger (cancels drag)
- [ ] Test verifies step returned to original position
- [ ] Test verifies step order unchanged
- [ ] Test covers Requirement 4 (Touch Drag Edge Cases)

**Implementation Notes:**

```typescript
test("should handle cancelled touch drag", async ({ page }) => {
  // Arrange
  const stepCards = page.locator('[data-testid="step-card"]');
  const firstStep = stepCards.nth(0);
  const originalOrder = [
    { duration: 300, power: 200 },
    { duration: 360, power: 210 },
    { duration: 420, power: 220 },
  ];

  // Act - Start drag and cancel with minimal movement
  const sourceBox = await firstStep.boundingBox();
  if (!sourceBox) throw new Error("Could not get source position");

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;

  await page.touchscreen.tap(sourceX, sourceY);
  await page.waitForTimeout(150); // Long press
  await page.mouse.move(sourceX + 5, sourceY + 5); // Small movement (< threshold)
  await page.touchscreen.tap(sourceX + 5, sourceY + 5); // Release

  // Assert - Verify order unchanged
  await verifyStepOrder(page, originalOrder);
});
```

**Requirements:** Requirement 4 (Touch Drag Edge Cases)

- [x] 4.3 Add Repetition Block Touch Drag Test

**Priority:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Task 2.2

**Description:**
Test touch drag for repetition blocks. Note: Existing keyboard test already validates block dimensions, but we need to verify touch drag works.

**Acceptance Criteria:**

- [ ] Test loads workout with repetition block
- [ ] Test performs touch drag on repetition block using `touchDrag()` helper
- [ ] Test verifies block moved to new position
- [ ] Test verifies block dimensions maintained (within 10% tolerance)
- [ ] Test verifies nested steps remain intact
- [ ] Test covers Requirement 4 (Touch Drag Edge Cases)

**Implementation Notes:**

```typescript
test("should handle repetition block touch drag", async ({ page }) => {
  // Arrange - Load workout with repetition block (reuse from existing test)
  const fileInput = page.locator('input[type="file"]');
  const testWorkout = createWorkoutWithBlock(); // Reuse helper from drag-drop-reordering.spec.ts

  await fileInput.setInputFiles({
    name: "block-workout.krd",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(testWorkout)),
  });

  await expect(page.getByText("Repeat Block")).toBeVisible();

  const blockCard = page.getByTestId("repetition-block-card");
  const regularStep = page.locator('[data-testid="step-card"]').nth(0);

  // Capture original dimensions
  const originalBox = await blockCard.boundingBox();
  expect(originalBox).not.toBeNull();

  // Act - Drag block using touch
  await touchDrag(page, blockCard, regularStep);

  // Assert - Verify block moved and dimensions maintained
  const newBox = await blockCard.boundingBox();
  expect(newBox).not.toBeNull();

  if (originalBox && newBox) {
    expect(Math.abs(newBox.width - originalBox.width)).toBeLessThan(
      originalBox.width * 0.1
    );
    expect(Math.abs(newBox.height - originalBox.height)).toBeLessThan(
      originalBox.height * 0.1
    );
  }

  // Verify nested steps intact
  const nestedSteps = blockCard.locator('[data-testid="nested-step"]');
  await expect(nestedSteps).toHaveCount(2);
});
```

**Requirements:** Requirement 4 (Touch Drag Edge Cases)

- [ ] 5. Performance Tests
  - [ ] 5.1 Add Drag Performance Timing Test

**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 2.2, Task 1.1

**Description:**
Test that touch drag operations complete within performance budget (500ms).

**Acceptance Criteria:**

- [ ] Test measures touch drag operation duration
- [ ] Test verifies operation completes within 500ms
- [ ] Test uses `measureDragPerformance()` helper from test-utils
- [ ] Test logs performance metrics for debugging
- [ ] Test covers Requirement 6 (Performance and Responsiveness)

**Implementation Notes:**

```typescript
test("should complete touch drag within 500ms", async ({ page }) => {
  // Arrange
  const stepCards = page.locator('[data-testid="step-card"]');

  // Act & Assert
  const duration = await measureDragPerformance(
    page,
    stepCards.nth(0),
    stepCards.nth(1)
  );

  expect(duration).toBeLessThan(500);
  console.log(`Touch drag operation completed in ${duration}ms`);
});
```

**Requirements:** Requirement 6 (Performance and Responsiveness)

- [ ] 5.2 Add Large Workout Performance Test

**Priority:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Task 5.1

**Description:**
Test touch drag performance with large workout (50+ steps). Note: Existing keyboard test already validates large workouts, but we need to verify touch performance.

**Acceptance Criteria:**

- [ ] Test loads workout with 50 steps
- [ ] Test performs touch drag on middle step (position 25)
- [ ] Test verifies operation completes within 500ms
- [ ] Test verifies smooth scrolling during drag
- [ ] Test covers Requirement 6 (Performance and Responsiveness)

**Implementation Notes:**

```typescript
test("should handle large workout touch drag performance", async ({ page }) => {
  // Arrange - Load 50-step workout (reuse createTestWorkout helper)
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "large-workout.krd",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(createTestWorkout(50))),
  });

  await expect(page.getByText("Test Workout")).toBeVisible();

  const stepCards = page.locator('[data-testid="step-card"]');
  await expect(stepCards).toHaveCount(50);

  // Act - Drag middle step using touch
  const middleStep = stepCards.nth(25);
  await middleStep.scrollIntoViewIfNeeded();

  const duration = await measureDragPerformance(
    page,
    middleStep,
    stepCards.nth(26)
  );

  // Assert
  expect(duration).toBeLessThan(500);
  console.log(`Large workout touch drag completed in ${duration}ms`);
});
```

**Requirements:** Requirement 6 (Performance and Responsiveness)

- [ ] 6. Documentation & CI
  - [ ] 6.1 Update E2E Test Documentation

**Priority:** High  
**Estimated Time:** 1 hour  
**Dependencies:** All previous tasks

**Description:**
Update E2E test documentation to include mobile touch drag tests and utilities.

**Acceptance Criteria:**

- [ ] Update `packages/workout-spa-editor/e2e/README.md`
- [ ] Document touch drag test utilities in test-utils section
- [ ] Add examples of running mobile touch tests
- [ ] Add troubleshooting section for common touch test issues
- [ ] Document test coverage and requirements mapping

**Implementation Notes:**

````markdown
## Mobile Touch Drag Tests

The mobile touch drag tests validate touch gesture functionality on mobile devices using Playwright's touchscreen API.

### Running Mobile Touch Tests

```bash
# Run all mobile touch tests
pnpm test:e2e mobile-touch-drag.spec.ts

# Run on specific mobile project
pnpm test:e2e mobile-touch-drag.spec.ts --project="Mobile Chrome"
pnpm test:e2e mobile-touch-drag.spec.ts --project="Mobile Safari"

# Run with UI mode
pnpm test:e2e mobile-touch-drag.spec.ts --ui
```

### Test Utilities

Located in `e2e/test-utils/`:

- `touchDrag(page, source, target, options?)` - Perform touch drag gesture
- `verifyStepOrder(page, expectedOrder)` - Verify step order after drag
- `measureDragPerformance(page, source, target)` - Measure drag timing

### Troubleshooting

**Touch drag not working:**

- Ensure `hasTouch: true` in viewport config
- Verify element is visible: `await element.scrollIntoViewIfNeeded()`

**Flaky tests:**

- Use deterministic waits: `await page.waitForSelector('[data-testid="step-card"]', { state: "stable" })`
- Avoid arbitrary timeouts
````

**Requirements:** All requirements (documentation)

- [ ] 6.2 Update Frontend Testing Steering Rule

**Priority:** Medium  
**Estimated Time:** 1 hour  
**Dependencies:** Task 6.1

**Description:**
Update frontend testing steering rule to include mobile touch drag testing requirements.

**Acceptance Criteria:**

- [ ] Update `.kiro/steering/frontend-testing.md`
- [ ] Add section on mobile touch drag testing requirements
- [ ] Document when to use touch drag tests vs keyboard shortcut tests
- [ ] Add mobile viewport testing requirements
- [ ] Add examples of touch drag test patterns

**Implementation Notes:**

```markdown
### Mobile Touch Drag Testing

When adding or modifying drag-and-drop functionality:

1. **MUST** add touch drag tests for mobile viewports
2. **MUST** test on both iOS (WebKit) and Android (Chromium)
3. **MUST** verify visual feedback during drag
4. **MUST** verify data integrity after drag
5. **SHOULD** test performance (< 500ms)

Use `touchDrag()` helper from `test-utils/touch-helpers.ts`.

**When to use touch tests vs keyboard tests:**

- Touch tests: Validate actual touch gestures on mobile
- Keyboard tests: Validate keyboard shortcuts (Alt+Up/Down)
- Both are required for comprehensive coverage
```

**Requirements:** All requirements (documentation)

- [ ] 6.3 Verify CI Configuration

**Priority:** High  
**Estimated Time:** 30 minutes  
**Dependencies:** All previous tasks

**Description:**
Verify CI pipeline is configured to run mobile touch drag tests. Note: Playwright config already has Mobile Chrome and Mobile Safari projects configured.

**Acceptance Criteria:**

- [ ] Verify `.github/workflows/workout-spa-editor-e2e.yml` runs all Playwright projects
- [ ] Verify mobile viewports (Mobile Chrome, Mobile Safari) are in Playwright config
- [ ] Verify tests run on both WebKit and Chromium browsers
- [ ] Verify test results are reported correctly in CI
- [ ] Confirm new test file will be picked up automatically

**Implementation Notes:**

The existing CI configuration should automatically run the new `mobile-touch-drag.spec.ts` file because:

1. Playwright config includes Mobile Chrome and Mobile Safari projects
2. CI workflow runs `pnpm test:e2e` which executes all projects
3. Test file is in `e2e/` directory which is the configured `testDir`

**Verification steps:**

1. Check `.github/workflows/workout-spa-editor-e2e.yml` runs `pnpm test:e2e`
2. Confirm `playwright.config.ts` has Mobile Chrome and Mobile Safari projects
3. After implementation, trigger CI and verify mobile tests run

**Requirements:** All requirements (CI/CD integration)

## Summary

### Total Estimated Time

- Phase 1: 5 hours (Touch utilities + viewport configs)
- Phase 2: 10 hours (Basic touch drag tests + cross-viewport)
- Phase 3: 5 hours (Visual feedback tests)
- Phase 4: 7 hours (Edge cases)
- Phase 5: 4 hours (Performance tests)
- Phase 6: 2.5 hours (Documentation + CI verification)

**Total: ~33.5 hours (~4-5 days)**

### Priority Breakdown

- **High Priority:** 6 tasks (18.5 hours)
- **Medium Priority:** 4 tasks (9 hours)
- **Low Priority:** 4 tasks (6 hours)

### Requirements Coverage

- **Requirement 1** (Touch Drag Implementation): Tasks 1.1, 2.1, 2.2
- **Requirement 2** (Touch Gesture Validation): Tasks 1.1, 2.1, 2.2, 2.3
- **Requirement 3** (Visual Feedback Testing): Tasks 3.1, 3.2
- **Requirement 4** (Touch Drag Edge Cases): Tasks 4.1, 4.2, 4.3
- **Requirement 5** (Cross-Device Compatibility): Tasks 1.2, 2.3
- **Requirement 6** (Performance and Responsiveness): Tasks 5.1, 5.2
- **Requirement 7** (Accessibility Considerations): Existing keyboard tests (no changes needed)

### Key Changes from Original Plan

1. **Reduced scope:** Removed redundant tasks since mobile viewport config already exists
2. **Reuse existing helpers:** Leverage `createTestWorkout()` from existing tests
3. **Focus on touch gestures:** Main gap is actual touch API usage, not keyboard shortcuts
4. **Simplified documentation:** Existing E2E README structure can be extended
5. **CI already configured:** Mobile projects already exist in Playwright config

### Success Criteria

- [ ] All touch drag tests use Playwright's touchscreen API (not keyboard shortcuts)
- [ ] Tests pass on Mobile Chrome (Chromium) and Mobile Safari (WebKit)
- [ ] Visual feedback is validated during drag operations
- [ ] Data integrity is maintained after touch drag reordering
- [ ] Performance tests verify operations complete within 500ms
- [ ] Documentation clearly explains touch drag testing approach
- [ ] CI pipeline runs mobile touch tests successfully
- [ ] Flakiness rate < 5% over 100 runs

```

```
