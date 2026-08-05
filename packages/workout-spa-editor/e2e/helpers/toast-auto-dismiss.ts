import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Radix Toast's viewport pauses its own auto-dismiss timer while the pointer
 * is over it: the listeners are `pointermove` -> pause and `pointerleave` ->
 * resume. A pointer that merely *rests* on the toast is therefore enough to
 * hold it open forever — Playwright leaves the mouse wherever the last click
 * landed, every toast is `pointer-events-auto`, and a `pointerleave` that
 * never fires never resumes the timer.
 *
 * Whether a click leaves the cursor inside that region depends on layout,
 * viewport size and scroll position, so waiting on a dismissal without moving
 * the pointer first is a race, not a timing budget. Raising the timeout cannot
 * fix it: a paused timer never expires.
 *
 * Where the toast viewport sits depends on the breakpoint (see
 * `ToastProvider`): `fixed top-0 w-full` below `sm`, and
 * `sm:bottom-0 sm:left-1/2 md:max-w-[420px]` above it. The left edge at half
 * height misses both bands — the corner does not, which is why this parks
 * mid-height rather than at (0, 0).
 */
/**
 * `Toast` defaults to a 5s duration. Once the timer is no longer pausable the
 * dismissal is deterministic, so one budget covers every call site.
 */
const AUTO_DISMISS_BUDGET_MS = 8000;

const FALLBACK_PARK_Y = 300;

export async function expectToastAutoDismissed(
  page: Page,
  toast: Locator,
  timeout: number = AUTO_DISMISS_BUDGET_MS
): Promise<void> {
  const viewport = page.viewportSize();
  await page.mouse.move(
    0,
    viewport ? Math.floor(viewport.height / 2) : FALLBACK_PARK_Y
  );
  await expect(toast).not.toBeVisible({ timeout });
}
