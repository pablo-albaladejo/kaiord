import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Touch drag helper utilities for E2E tests
 *
 * These utilities provide reusable functions for testing touch drag interactions
 * using Playwright's touchscreen API.
 */

/**
 * Options for touch drag operations
 */
export type TouchDragOptions = {
  /**
   * Number of intermediate points for smooth interpolation
   * @default 10
   */
  steps?: number;

  /**
   * Delay between touch events in milliseconds
   * @default 50
   */
  delay?: number;

  /**
   * Whether to use long press before drag
   * @default true
   */
  longPress?: boolean;

  /**
   * Long press duration in milliseconds
   * @default 150
   */
  longPressDuration?: number;
};

/**
 * Expected step order for verification
 */
export type ExpectedStepOrder = Array<{
  duration: number;
  power: number;
}>;

/**
 * Performance measurement result
 */
export type PerformanceResult = {
  duration: number;
  startTime: number;
  endTime: number;
};

/**
 * Performs a touch drag operation using Playwright's touchscreen API with smooth interpolation
 *
 * This function uses Playwright's page.touchscreen API to simulate a touch drag gesture.
 * Since Playwright's touchscreen API only provides tap() method and doesn't have a native
 * drag method, this implementation uses a hybrid approach:
 *
 * 1. Uses touchscreen.tap() to initiate touch at source position
 * 2. Performs smooth interpolation with multiple intermediate touch points
 * 3. Each intermediate position is touched using touchscreen.tap()
 * 4. The rapid sequence of taps along the path simulates a drag gesture
 *
 * The smooth interpolation (default 10 steps) creates a realistic drag motion that
 * helps trigger drag-and-drop libraries correctly.
 *
 * @param page - Playwright page object
 * @param source - Source element to drag from
 * @param target - Target element to drag to
 * @param options - Optional configuration for the drag operation
 *
 * @example
 * ```typescript
 * const stepCards = page.locator('[data-testid="step-card"]');
 * await touchDrag(page, stepCards.nth(0), stepCards.nth(1));
 * ```
 */
export async function touchDrag(
  page: Page,
  source: Locator,
  target: Locator,
  options: TouchDragOptions = {}
): Promise<void> {
  const {
    steps = 10,
    delay = 50,
    longPress = true,
    longPressDuration = 150,
  } = options;

  // Ensure elements are visible and stable
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  // Get bounding boxes for source and target
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get bounding boxes for source or target");
  }

  // Calculate center points for touch positions
  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  // Initiate touch at source position using touchscreen API
  await page.touchscreen.tap(sourceX, sourceY);

  // Long press to signal drag intent (if enabled)
  // This delay allows the DnD library to recognize the gesture as a drag, not a tap
  if (longPress) {
    await page.waitForTimeout(longPressDuration);
  }

  // Perform smooth interpolation from source to target
  // Break the movement into multiple steps for realistic drag motion
  for (let i = 1; i <= steps; i++) {
    // Calculate progress ratio (0.1, 0.2, ..., 1.0 for 10 steps)
    const progress = i / steps;

    // Linear interpolation between source and target positions
    const currentX = sourceX + (targetX - sourceX) * progress;
    const currentY = sourceY + (targetY - sourceY) * progress;

    // Touch at the interpolated position
    // Note: Playwright's touchscreen.tap() is used as there's no touchscreen.move()
    // The sequence of taps along the path simulates continuous touch movement
    await page.touchscreen.tap(currentX, currentY);

    // Add delay between steps for smooth, realistic animation
    // This prevents the gesture from being too fast and helps DnD libraries track it
    if (delay > 0 && i < steps) {
      await page.waitForTimeout(delay);
    }
  }

  // Wait for DOM to stabilize after the drag operation completes
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Performs a touch drag operation using native touch events (touchstart, touchmove, touchend)
 *
 * This is an alternative to touchDrag() that uses native touch events instead of
 * Playwright's touchscreen API. Use this when you need more control over the touch events.
 *
 * This function dispatches native DOM touch events directly to elements, which can be useful
 * for testing scenarios where you need precise control over the event sequence or when
 * Playwright's touchscreen API doesn't provide the desired behavior.
 *
 * The function:
 * 1. Dispatches touchstart on the source element
 * 2. Dispatches multiple touchmove events with smooth interpolation
 * 3. Dispatches touchend on the target element
 *
 * @param page - Playwright page object
 * @param source - Source element to drag from
 * @param target - Target element to drag to
 * @param options - Optional configuration for the drag operation
 *
 * @example
 * ```typescript
 * const stepCards = page.locator('[data-testid="step-card"]');
 * await touchDragNative(page, stepCards.nth(0), stepCards.nth(1));
 * ```
 */
export async function touchDragNative(
  page: Page,
  source: Locator,
  target: Locator,
  options: TouchDragOptions = {}
): Promise<void> {
  const { steps = 10, delay = 50 } = options;

  // Ensure elements are visible and stable
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  // Get bounding boxes for source and target
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get bounding boxes for source or target");
  }

  // Calculate center points for touch positions
  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  // Dispatch touchstart event on the source element
  // This initiates the touch interaction
  await source.dispatchEvent("touchstart", {
    touches: [{ clientX: sourceX, clientY: sourceY }],
    changedTouches: [{ clientX: sourceX, clientY: sourceY }],
    bubbles: true,
    cancelable: true,
  });

  // Small delay after touchstart to allow DnD library to register the touch
  if (delay > 0) {
    await page.waitForTimeout(delay);
  }

  // Perform smooth interpolation with touchmove events
  // Dispatch touchmove events on the document body to simulate finger movement
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceX + (targetX - sourceX) * progress;
    const currentY = sourceY + (targetY - sourceY) * progress;

    // Dispatch touchmove on the body element (touch events bubble up)
    await page.evaluate(
      ({ x, y }) => {
        const touchMoveEvent = new TouchEvent("touchmove", {
          touches: [
            new Touch({
              identifier: 0,
              target: document.body,
              clientX: x,
              clientY: y,
              screenX: x,
              screenY: y,
              pageX: x,
              pageY: y,
            }),
          ],
          changedTouches: [
            new Touch({
              identifier: 0,
              target: document.body,
              clientX: x,
              clientY: y,
              screenX: x,
              screenY: y,
              pageX: x,
              pageY: y,
            }),
          ],
          bubbles: true,
          cancelable: true,
        });
        document.body.dispatchEvent(touchMoveEvent);
      },
      { x: currentX, y: currentY }
    );

    // Add delay between touchmove events for smooth animation
    if (delay > 0 && i < steps) {
      await page.waitForTimeout(delay);
    }
  }

  // Dispatch touchend event on the target element
  // This completes the touch interaction
  await target.dispatchEvent("touchend", {
    touches: [],
    changedTouches: [{ clientX: targetX, clientY: targetY }],
    bubbles: true,
    cancelable: true,
  });

  // Wait for DOM to stabilize after the drag operation completes
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Verifies the order of workout steps by checking their data (duration and power)
 *
 * @param page - Playwright page object
 * @param expectedOrder - Array of expected step data in order
 *
 * @example
 * ```typescript
 * await verifyStepOrder(page, [
 *   { duration: 300, power: 200 },
 *   { duration: 360, power: 210 },
 *   { duration: 420, power: 220 },
 * ]);
 * ```
 */
export async function verifyStepOrder(
  page: Page,
  expectedOrder: ExpectedStepOrder
): Promise<void> {
  const stepCards = page.locator('[data-testid="step-card"]');

  for (let i = 0; i < expectedOrder.length; i++) {
    const step = expectedOrder[i];
    const card = stepCards.nth(i);

    // Convert seconds to minutes for display
    const minutes = Math.floor(step.duration / 60);

    // Verify duration
    await expect(card).toContainText(`${minutes} min`);

    // Verify power
    await expect(card).toContainText(`${step.power}W`);
  }
}

/**
 * Measures the performance of a touch drag operation
 *
 * @param page - Playwright page object
 * @param source - Source element to drag from
 * @param target - Target element to drag to
 * @param options - Optional configuration for the drag operation
 * @returns Performance measurement result with duration in milliseconds
 *
 * @example
 * ```typescript
 * const result = await measureDragPerformance(
 *   page,
 *   stepCards.nth(0),
 *   stepCards.nth(1)
 * );
 * console.log(`Drag completed in ${result.duration}ms`);
 * ```
 */
export async function measureDragPerformance(
  page: Page,
  source: Locator,
  target: Locator,
  options: TouchDragOptions = {}
): Promise<PerformanceResult> {
  const startTime = Date.now();

  await touchDrag(page, source, target, options);

  const endTime = Date.now();
  const duration = endTime - startTime;

  return {
    duration,
    startTime,
    endTime,
  };
}

/**
 * Verifies that a drag preview element is visible during drag operation
 *
 * @param page - Playwright page object
 * @param draggedElement - The element being dragged
 *
 * @example
 * ```typescript
 * const firstStep = stepCards.nth(0);
 * await verifyDragPreview(page, firstStep);
 * ```
 */
export async function verifyDragPreview(
  page: Page,
  draggedElement: Locator
): Promise<void> {
  // Check for common drag preview classes
  // Note: Actual class names may vary based on DnD Kit implementation
  const hasDraggingClass = await draggedElement.evaluate((el) => {
    return (
      el.classList.contains("dragging") ||
      el.classList.contains("drag-active") ||
      el.classList.contains("is-dragging")
    );
  });

  expect(hasDraggingClass).toBe(true);
}

/**
 * Verifies that a drop zone indicator is visible at the target position
 *
 * @param page - Playwright page object
 * @param targetPosition - The target position for the drop
 *
 * @example
 * ```typescript
 * await verifyDropZone(page, stepCards.nth(1));
 * ```
 */
export async function verifyDropZone(
  page: Page,
  targetPosition: Locator
): Promise<void> {
  // Check for drop indicator element
  const dropIndicator = page.locator('[data-testid="drop-indicator"]');
  await expect(dropIndicator).toBeVisible();

  // Verify drop indicator is near the target position
  const targetBox = await targetPosition.boundingBox();
  const indicatorBox = await dropIndicator.boundingBox();

  if (!targetBox || !indicatorBox) {
    throw new Error("Could not get bounding boxes for verification");
  }

  // Verify indicator is within reasonable proximity (within 50px)
  const distance = Math.abs(indicatorBox.y - targetBox.y);
  expect(distance).toBeLessThan(50);
}
