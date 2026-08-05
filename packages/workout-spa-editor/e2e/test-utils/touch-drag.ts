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
 * Performs a drag as ONE continuous pointer gesture: press on the source,
 * interpolated moves, release on the target.
 *
 * The list's dnd wiring is a `PointerSensor` with an 8px activation
 * distance, so a drag only exists to the app as pointerdown → moves →
 * pointerup on a single pointer. `page.mouse` emits exactly that sequence
 * on every project, touch-emulated or not. A sequence of independent taps
 * is NOT a drag: each tap is its own press-and-release, the sensor never
 * activates, and every interpolated point lands as a click on whatever
 * control happens to sit under it.
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

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();

  if (longPress) {
    await page.waitForTimeout(longPressDuration);
  }

  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const currentX = sourceX + (targetX - sourceX) * progress;
    const currentY = sourceY + (targetY - sourceY) * progress;

    await page.mouse.move(currentX, currentY);

    if (delay > 0 && i < steps) {
      await page.waitForTimeout(delay);
    }
  }

  await page.mouse.up();
}
