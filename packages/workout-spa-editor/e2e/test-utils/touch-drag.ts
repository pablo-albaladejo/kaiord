import type { Locator, Page } from "@playwright/test";

/**
 * Options for touch drag operations
 */
export type TouchDragOptions = {
  steps?: number;
  delay?: number;
  longPress?: boolean;
  longPressDuration?: number;
};

/**
 * Performs a touch drag operation using Playwright's touchscreen API with smooth interpolation
 *
 * @param page - Playwright page object
 * @param source - Source element to drag from
 * @param target - Target element to drag to
 * @param options - Optional configuration for the drag operation
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

  await page.touchscreen.tap(sourceX, sourceY);

  if (longPress) {
    await page.waitForTimeout(longPressDuration);
  }

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceX + (targetX - sourceX) * progress;
    const currentY = sourceY + (targetY - sourceY) * progress;

    await page.touchscreen.tap(currentX, currentY);

    if (delay > 0 && i < steps) {
      await page.waitForTimeout(delay);
    }
  }

  await page.waitForLoadState("domcontentloaded");
}
