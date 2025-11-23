# Design Document: Mobile Touch Drag Testing

## Overview

This design document outlines the technical approach for implementing comprehensive mobile touch drag testing for the Workout SPA Editor. The current implementation uses keyboard shortcuts as a workaround, but this doesn't validate the actual touch gesture experience that mobile users encounter.

## Design Goals

1. **Authentic Touch Simulation**: Use Playwright's touchscreen API to simulate real touch gestures
2. **Cross-Device Validation**: Test across iOS and Android mobile viewports
3. **Visual Feedback Verification**: Validate drag preview and drop zone indicators
4. **Data Integrity**: Ensure step data remains intact after touch drag operations
5. **Performance**: Maintain smooth 60fps interactions during drag operations
6. **Maintainability**: Follow existing E2E test patterns and conventions

## Architecture

### Component Interaction Flow

```
User Touch Input
    ↓
Playwright Touchscreen API
    ↓
Browser Touch Events (touchstart, touchmove, touchend)
    ↓
DnD Kit Touch Sensor
    ↓
Workout Store (reorderStep action)
    ↓
React Re-render
    ↓
Visual Feedback + DOM Update
```

### Test Architecture

```
E2E Test Suite
├── Mobile Touch Drag Tests (new)
│   ├── Basic touch drag
│   ├── Visual feedback validation
│   ├── Edge cases (first/last step)
│   ├── Repetition block drag
│   └── Performance validation
└── Existing Keyboard Tests (keep)
    ├── Alt+Up/Down shortcuts
    └── Undo/redo support
```

## Technical Design

### 1. Touch Drag Implementation

#### Playwright Touch API Usage

```typescript
// Touch drag sequence
const touchDrag = async (
  page: Page,
  sourceElement: Locator,
  targetElement: Locator
) => {
  // Get bounding boxes for source and target
  const sourceBox = await sourceElement.boundingBox();
  const targetBox = await targetElement.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get element positions");
  }

  // Calculate touch coordinates (center of elements)
  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  // Perform touch drag
  await page.touchscreen.tap(sourceX, sourceY);
  await page.waitForTimeout(100); // Brief delay for touch recognition
  await page.touchscreen.tap(sourceX, sourceY); // Long press start
  await page.mouse.move(targetX, targetY, { steps: 10 }); // Smooth drag
  await page.touchscreen.tap(targetX, targetY); // Release
};
```

#### Alternative: Native Touch Events

```typescript
// More realistic touch event sequence
const touchDragNative = async (
  page: Page,
  sourceElement: Locator,
  targetElement: Locator
) => {
  const sourceBox = await sourceElement.boundingBox();
  const targetBox = await targetElement.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get element positions");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  // Dispatch touch events directly
  await page.dispatchEvent(sourceElement, "touchstart", {
    touches: [{ clientX: sourceX, clientY: sourceY }],
  });

  await page.waitForTimeout(150); // Long press threshold

  // Simulate drag movement
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    const x = sourceX + ((targetX - sourceX) * i) / steps;
    const y = sourceY + ((targetY - sourceY) * i) / steps;

    await page.dispatchEvent(sourceElement, "touchmove", {
      touches: [{ clientX: x, clientY: y }],
    });

    await page.waitForTimeout(16); // ~60fps
  }

  await page.dispatchEvent(sourceElement, "touchend", {
    changedTouches: [{ clientX: targetX, clientY: targetY }],
  });
};
```

### 2. Visual Feedback Testing

#### CSS Class Verification

```typescript
// Verify drag preview styling
const verifyDragPreview = async (page: Page, draggedElement: Locator) => {
  // Check for drag-in-progress classes
  await expect(draggedElement).toHaveClass(/dragging/);
  await expect(draggedElement).toHaveClass(/opacity-50/);

  // Verify drag overlay exists
  const dragOverlay = page.locator('[data-testid="drag-overlay"]');
  await expect(dragOverlay).toBeVisible();
};

// Verify drop zone indicator
const verifyDropZone = async (page: Page, targetPosition: number) => {
  const dropIndicator = page.locator(
    `[data-testid="drop-indicator-${targetPosition}"]`
  );
  await expect(dropIndicator).toBeVisible();
  await expect(dropIndicator).toHaveClass(/border-primary-500/);
};
```

#### Visual Regression Testing (Optional)

```typescript
// Capture screenshots during drag operation
test("should show correct visual feedback during drag", async ({ page }) => {
  // ... setup ...

  // Capture before drag
  await page.screenshot({ path: "before-drag.png" });

  // Start drag
  await touchDragStart(page, firstStep);

  // Capture during drag
  await page.screenshot({ path: "during-drag.png" });

  // Complete drag
  await touchDragEnd(page, targetPosition);

  // Capture after drag
  await page.screenshot({ path: "after-drag.png" });

  // Compare with baseline (if using visual regression)
  // expect(await page.screenshot()).toMatchSnapshot('drag-sequence.png');
});
```

### 3. Data Integrity Validation

#### Step Data Verification

```typescript
// Verify step data after reorder
const verifyStepData = async (
  page: Page,
  expectedOrder: Array<{ duration: number; power: number }>
) => {
  const stepCards = page.locator('[data-testid="step-card"]');

  for (let i = 0; i < expectedOrder.length; i++) {
    const step = stepCards.nth(i);
    const { duration, power } = expectedOrder[i];

    // Verify duration
    await expect(step).toContainText(`${Math.floor(duration / 60)} min`);

    // Verify power
    await expect(step).toContainText(`${power}W`);

    // Verify stepIndex is sequential
    await expect(step).toContainText(`Step ${i + 1}`);
  }
};
```

#### Store State Verification

```typescript
// Verify Zustand store state after reorder
const verifyStoreState = async (page: Page) => {
  const storeState = await page.evaluate(() => {
    // Access store state from window (if exposed for testing)
    return (window as any).__WORKOUT_STORE_STATE__;
  });

  // Verify step order in store
  expect(storeState.currentWorkout.extensions.workout.steps).toHaveLength(3);
  expect(storeState.currentWorkout.extensions.workout.steps[0].stepIndex).toBe(
    0
  );
  expect(storeState.currentWorkout.extensions.workout.steps[1].stepIndex).toBe(
    1
  );
};
```

### 4. Mobile Viewport Configuration

#### Viewport Presets

```typescript
// Mobile viewport configurations
const MOBILE_VIEWPORTS = {
  iphoneSE: { width: 375, height: 667, hasTouch: true },
  iphone12: { width: 390, height: 844, hasTouch: true },
  iphone14ProMax: { width: 430, height: 932, hasTouch: true },
  pixel5: { width: 393, height: 851, hasTouch: true },
  galaxyS21: { width: 360, height: 800, hasTouch: true },
  iPadMini: { width: 768, height: 1024, hasTouch: true },
};

// Test across multiple viewports
for (const [device, viewport] of Object.entries(MOBILE_VIEWPORTS)) {
  test.describe(`Mobile Touch Drag - ${device}`, () => {
    test.use({ viewport });

    test("should support touch drag", async ({ page }) => {
      // ... test implementation ...
    });
  });
}
```

### 5. Performance Validation

#### Timing Measurements

```typescript
// Measure drag operation performance
const measureDragPerformance = async (
  page: Page,
  sourceElement: Locator,
  targetElement: Locator
) => {
  const startTime = Date.now();

  await touchDrag(page, sourceElement, targetElement);

  // Wait for DOM update
  await page.waitForSelector('[data-testid="step-card"]', { state: "stable" });

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Verify operation completed within 500ms
  expect(duration).toBeLessThan(500);

  return duration;
};
```

#### Frame Rate Monitoring

```typescript
// Monitor frame rate during drag (advanced)
const monitorFrameRate = async (page: Page) => {
  const frameRates = await page.evaluate(() => {
    return new Promise<number[]>((resolve) => {
      const rates: number[] = [];
      let lastTime = performance.now();
      let frameCount = 0;

      const measureFrame = () => {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;

        if (delta >= 1000) {
          rates.push((frameCount * 1000) / delta);
          frameCount = 0;
          lastTime = currentTime;
        }

        frameCount++;

        if (rates.length < 5) {
          requestAnimationFrame(measureFrame);
        } else {
          resolve(rates);
        }
      };

      requestAnimationFrame(measureFrame);
    });
  });

  // Verify average frame rate is close to 60fps
  const avgFrameRate = frameRates.reduce((a, b) => a + b) / frameRates.length;
  expect(avgFrameRate).toBeGreaterThan(55); // Allow 5fps tolerance
};
```

### 6. Edge Case Handling

#### Boundary Conditions

```typescript
// Test dragging first step
test("should handle dragging first step", async ({ page }) => {
  // ... setup ...

  const firstStep = stepCards.nth(0);
  const secondStep = stepCards.nth(1);

  // Attempt to drag first step up (should not move)
  await touchDrag(page, firstStep, firstStep); // Drag to itself

  // Verify order unchanged
  await verifyStepData(page, originalOrder);

  // Drag first step down (should work)
  await touchDrag(page, firstStep, secondStep);

  // Verify order changed
  await verifyStepData(page, [originalOrder[1], originalOrder[0]]);
});

// Test dragging last step
test("should handle dragging last step", async ({ page }) => {
  // ... setup ...

  const lastStep = stepCards.nth(2);
  const secondToLastStep = stepCards.nth(1);

  // Attempt to drag last step down (should not move)
  await touchDrag(page, lastStep, lastStep);

  // Verify order unchanged
  await verifyStepData(page, originalOrder);

  // Drag last step up (should work)
  await touchDrag(page, lastStep, secondToLastStep);

  // Verify order changed
  await verifyStepData(page, [
    originalOrder[0],
    originalOrder[2],
    originalOrder[1],
  ]);
});
```

#### Cancelled Drag

```typescript
// Test drag cancellation
test("should handle cancelled drag", async ({ page }) => {
  // ... setup ...

  const firstStep = stepCards.nth(0);
  const sourceBox = await firstStep.boundingBox();

  if (!sourceBox) throw new Error("Could not get source position");

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;

  // Start drag
  await page.touchscreen.tap(sourceX, sourceY);
  await page.waitForTimeout(150);

  // Move slightly (not enough to trigger reorder)
  await page.mouse.move(sourceX + 5, sourceY + 5);

  // Cancel by releasing
  await page.touchscreen.tap(sourceX + 5, sourceY + 5);

  // Verify order unchanged
  await verifyStepData(page, originalOrder);
});
```

### 7. Repetition Block Handling

#### Block Drag Validation

```typescript
// Test repetition block drag
test("should handle repetition block touch drag", async ({ page }) => {
  // ... setup with repetition block ...

  const blockCard = page.getByTestId("repetition-block-card");
  const regularStep = stepCards.nth(0);

  // Get original dimensions
  const originalBox = await blockCard.boundingBox();
  expect(originalBox).not.toBeNull();

  // Perform touch drag
  await touchDrag(page, blockCard, regularStep);

  // Verify block moved
  const newPosition = await blockCard.boundingBox();
  expect(newPosition).not.toBeNull();

  // Verify dimensions maintained
  if (originalBox && newPosition) {
    expect(Math.abs(newPosition.width - originalBox.width)).toBeLessThan(10);
    expect(Math.abs(newPosition.height - originalBox.height)).toBeLessThan(10);
  }

  // Verify block integrity (all nested steps present)
  const nestedSteps = blockCard.locator('[data-testid="nested-step"]');
  await expect(nestedSteps).toHaveCount(2);
});
```

## Test Organization

### File Structure

```
packages/workout-spa-editor/e2e/
├── drag-drop-reordering.spec.ts (existing - keyboard shortcuts)
├── mobile-touch-drag.spec.ts (new - touch gestures)
└── test-utils/
    ├── touch-helpers.ts (new - touch drag utilities)
    └── viewport-configs.ts (new - mobile viewport presets)
```

### Test Utilities

```typescript
// test-utils/touch-helpers.ts
import type { Locator, Page } from "@playwright/test";

export const touchDrag = async (
  page: Page,
  source: Locator,
  target: Locator,
  options?: { steps?: number; delay?: number }
) => {
  const { steps = 10, delay = 16 } = options || {};

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get element positions");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  // Touch start
  await page.touchscreen.tap(sourceX, sourceY);
  await page.waitForTimeout(150); // Long press threshold

  // Touch move
  for (let i = 1; i <= steps; i++) {
    const x = sourceX + ((targetX - sourceX) * i) / steps;
    const y = sourceY + ((targetY - sourceY) * i) / steps;
    await page.mouse.move(x, y);
    await page.waitForTimeout(delay);
  }

  // Touch end
  await page.touchscreen.tap(targetX, targetY);
};

export const verifyStepOrder = async (
  page: Page,
  expectedOrder: Array<{ duration: number; power: number }>
) => {
  const stepCards = page.locator('[data-testid="step-card"]');

  for (let i = 0; i < expectedOrder.length; i++) {
    const step = stepCards.nth(i);
    const { duration, power } = expectedOrder[i];

    await expect(step).toContainText(`${Math.floor(duration / 60)} min`);
    await expect(step).toContainText(`${power}W`);
  }
};
```

```typescript
// test-utils/viewport-configs.ts
export const MOBILE_VIEWPORTS = {
  iphoneSE: { width: 375, height: 667, hasTouch: true },
  iphone12: { width: 390, height: 844, hasTouch: true },
  pixel5: { width: 393, height: 851, hasTouch: true },
  iPadMini: { width: 768, height: 1024, hasTouch: true },
} as const;

export type MobileViewport = keyof typeof MOBILE_VIEWPORTS;
```

## Implementation Plan

### Phase 1: Touch Drag Utilities (1 day)

1. Create `test-utils/touch-helpers.ts` with touch drag functions
2. Create `test-utils/viewport-configs.ts` with mobile viewport presets
3. Add unit tests for touch helper functions (if applicable)

### Phase 2: Basic Touch Drag Tests (2 days)

1. Create `mobile-touch-drag.spec.ts` with basic touch drag test
2. Implement touch drag for single step reordering
3. Verify data integrity after touch drag
4. Test across iOS and Android viewports

### Phase 3: Visual Feedback Tests (1 day)

1. Add tests for drag preview styling
2. Add tests for drop zone indicators
3. Verify CSS classes during drag operation
4. Optional: Add visual regression tests

### Phase 4: Edge Cases (2 days)

1. Test dragging first/last steps
2. Test cancelled drag operations
3. Test repetition block drag
4. Test rapid consecutive drags

### Phase 5: Performance Tests (1 day)

1. Add timing measurements for drag operations
2. Verify operations complete within 500ms
3. Optional: Add frame rate monitoring
4. Test with large workout (50+ steps)

### Phase 6: Documentation & CI (1 day)

1. Update E2E test README
2. Update frontend-testing.md steering rule
3. Ensure CI runs mobile touch tests
4. Add troubleshooting guide for flaky tests

## Testing Strategy

### Test Coverage

| Scenario                    | Priority | Viewports         | Status      |
| --------------------------- | -------- | ----------------- | ----------- |
| Basic touch drag            | High     | All               | To Do       |
| Visual feedback             | High     | iPhone 12, Pixel5 | To Do       |
| Data integrity              | High     | All               | To Do       |
| First/last step edge cases  | Medium   | iPhone 12         | To Do       |
| Cancelled drag              | Medium   | iPhone 12         | To Do       |
| Repetition block drag       | Medium   | iPad Mini         | To Do       |
| Performance (< 500ms)       | Medium   | All               | To Do       |
| Large workout (50+ steps)   | Low      | iPhone 12         | To Do       |
| Rapid consecutive drags     | Low      | Pixel5            | To Do       |
| Visual regression (optional | Low      | iPhone 12         | Future Work |

### Acceptance Criteria Mapping

| Requirement | Test Coverage                                  |
| ----------- | ---------------------------------------------- |
| Req 1       | Basic touch drag test                          |
| Req 2       | All tests use Playwright touchscreen API       |
| Req 3       | Visual feedback tests                          |
| Req 4       | Edge case tests (first/last, cancelled, block) |
| Req 5       | Tests run across multiple viewports            |
| Req 6       | Performance timing tests                       |
| Req 7       | Existing keyboard tests remain (no changes)    |

## Risk Mitigation

### Flakiness Prevention

1. **Use deterministic waits**: `waitForSelector` with `state: 'stable'` instead of `waitForTimeout`
2. **Verify element positions**: Always check `boundingBox()` is not null before drag
3. **Add retry logic**: Use Playwright's built-in retry mechanism
4. **Isolate tests**: Each test loads its own workout, no shared state

### Cross-Browser Compatibility

1. **Test on WebKit**: Ensure iOS Safari behavior is validated
2. **Test on Chromium**: Ensure Android Chrome behavior is validated
3. **Avoid browser-specific APIs**: Use standard touch events
4. **Fallback to keyboard**: Keep keyboard shortcuts as alternative

### Performance Considerations

1. **Limit animation duration**: Use reduced motion in tests if needed
2. **Batch DOM updates**: Ensure React batches state updates
3. **Avoid unnecessary re-renders**: Use React.memo for step cards
4. **Monitor test duration**: Fail tests that take > 30 seconds

## Success Metrics

1. **Test Pass Rate**: > 95% across all mobile viewports
2. **Test Duration**: < 30 seconds per test
3. **Coverage**: All 7 requirements have corresponding tests
4. **Flakiness**: < 5% flakiness rate over 100 runs
5. **Performance**: All drag operations complete within 500ms

## Future Enhancements

1. **Visual Regression Testing**: Add screenshot comparison for drag preview
2. **Multi-Touch Gestures**: Support pinch-to-zoom, two-finger scroll
3. **Haptic Feedback**: Validate haptic feedback on supported devices
4. **Accessibility**: Test with screen readers and assistive technology
5. **Network Conditions**: Test under slow 3G, offline scenarios

## References

- [Playwright Touch API](https://playwright.dev/docs/api/class-touchscreen)
- [DnD Kit Touch Sensor](https://docs.dndkit.com/api-documentation/sensors/touch)
- [Frontend Testing Guidelines](.kiro/steering/frontend-testing.md)
- [Existing E2E Tests](packages/workout-spa-editor/e2e/drag-drop-reordering.spec.ts)
