import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Opens the block actions menu with a real click. The trigger is scrolled to
 * the viewport centre first: minimal scrolling can leave it under the sticky
 * header or the floating bottom nav, and a `force: true` click there lands
 * on the chrome instead — on mobile it used to tap the header's Athlete
 * entry and navigate away, so the menu never opened.
 *
 * The scroll must be `instant`. The app sets `html { scroll-behavior:
 * smooth }`, so a bare `scrollIntoView` animates and returns at once; in
 * Firefox the glide outlasts Playwright's stability check, whose retries
 * then call `scrollIntoView({ block })` themselves — smooth again. The page
 * is still moving when the click fires: Radix opens the menu on
 * `pointerdown`, the menu slides under the motionless pointer, and the
 * `pointerup` selects whichever item arrived there (usually "Delete"),
 * closing the menu before it can be seen.
 */
export async function openBlockActionsMenu(trigger: Locator): Promise<void> {
  await expect(trigger).toBeVisible({ timeout: 5000 });
  await trigger.evaluate((el) =>
    el.scrollIntoView({ block: "center", behavior: "instant" })
  );
  await trigger.click();
  await expect(trigger.page().getByRole("menu")).toBeVisible({
    timeout: 5000,
  });
}
