import type { Page } from "@playwright/test";

/**
 * Dispatches a touchmove event at the specified coordinates
 *
 * @param page - Playwright page object
 * @param x - X coordinate
 * @param y - Y coordinate
 */
export async function dispatchTouchMove(
  page: Page,
  x: number,
  y: number
): Promise<void> {
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
    { x, y }
  );
}
