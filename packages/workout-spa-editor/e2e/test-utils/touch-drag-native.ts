import type { Locator, Page } from "@playwright/test";
import type { TouchDragOptions } from "./touch-drag";
import { dispatchTouchMove } from "./touch-event-dispatcher";

/**
 * Performs a touch drag operation using native touch events
 *
 * @param page - Playwright page object
 * @param source - Source element to drag from
 * @param target - Target element to drag to
 * @param options - Optional configuration for the drag operation
 */
export async function touchDragNative(
  page: Page,
  source: Locator,
  target: Locator,
  options: TouchDragOptions = {}
): Promise<void> {
  const { steps = 10, delay = 50 } = options;

  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not get bounding boxes for source or target");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await source.dispatchEvent("touchstart", {
    touches: [{ clientX: sourceX, clientY: sourceY }],
    changedTouches: [{ clientX: sourceX, clientY: sourceY }],
    bubbles: true,
    cancelable: true,
  });

  if (delay > 0) {
    await page.waitForTimeout(delay);
  }

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceX + (targetX - sourceX) * progress;
    const currentY = sourceY + (targetY - sourceY) * progress;

    await dispatchTouchMove(page, currentX, currentY);

    if (delay > 0 && i < steps) {
      await page.waitForTimeout(delay);
    }
  }

  await target.dispatchEvent("touchend", {
    touches: [],
    changedTouches: [{ clientX: targetX, clientY: targetY }],
    bubbles: true,
    cancelable: true,
  });

  await page.waitForLoadState("domcontentloaded");
}
