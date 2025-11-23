import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Expected step order for verification
 */
export type ExpectedStepOrder = Array<{
  duration: number;
  power: number;
}>;

/**
 * Verifies the order of workout steps by checking their data
 *
 * @param page - Playwright page object
 * @param expectedOrder - Array of expected step data in order
 */
export async function verifyStepOrder(
  page: Page,
  expectedOrder: ExpectedStepOrder
): Promise<void> {
  const stepCards = page.locator('[data-testid="step-card"]');

  for (let i = 0; i < expectedOrder.length; i++) {
    const step = expectedOrder[i];
    const card = stepCards.nth(i);
    const minutes = Math.floor(step.duration / 60);

    await expect(card).toContainText(`${minutes} min`);
    await expect(card).toContainText(`${step.power}W`);
  }
}

/**
 * Verifies that a drag preview element is visible during drag operation
 *
 * @param draggedElement - The element being dragged
 */
export async function verifyDragPreview(
  draggedElement: Locator
): Promise<void> {
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
 */
export async function verifyDropZone(
  page: Page,
  targetPosition: Locator
): Promise<void> {
  const dropIndicator = page.locator('[data-testid="drop-indicator"]');
  await expect(dropIndicator).toBeVisible();

  const targetBox = await targetPosition.boundingBox();
  const indicatorBox = await dropIndicator.boundingBox();

  if (!targetBox || !indicatorBox) {
    throw new Error("Could not get bounding boxes for verification");
  }

  const distance = Math.abs(indicatorBox.y - targetBox.y);
  expect(distance).toBeLessThan(50);
}
