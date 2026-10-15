import type { Locator } from "@playwright/test";

/**
 * Clicks a control after bringing it to the viewport centre with an instant
 * scroll, so Playwright never has to scroll it there itself.
 *
 * On a phone the minimal scroll Playwright starts with leaves a control near
 * the bottom edge under the floating bottom nav. Its retries then scroll with
 * a forced alignment through `scrollIntoView`, which the app's
 * `html { scroll-behavior: smooth }` animates, and the click fires at once:
 * WebKit was seen delivering `pointerdown` to "Add account" with the page
 * still gliding, `pointerup` 50 px further on, and the `click` to the common
 * ancestor — the form never opened, or "Save account" never saved.
 */
export async function clickCentred(target: Locator): Promise<void> {
  await target.evaluate((el) =>
    el.scrollIntoView({ block: "center", behavior: "instant" })
  );
  await target.click();
}
