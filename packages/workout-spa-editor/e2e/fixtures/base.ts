/**
 * Base test fixture that disables onboarding tutorial by default
 *
 * This fixture automatically sets localStorage to mark the tutorial as completed,
 * preventing it from blocking test execution.
 *
 * Tests can override this by clearing localStorage in beforeEach:
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await page.evaluate(() => localStorage.clear());
 * });
 * ```
 *
 * It also retries `page.goto` on transient browser-internal crashes (see
 * `TRANSIENT_NAV_CRASH`): WebKit on CI intermittently aborts a navigation
 * with "WebKit encountered an internal error" (and processes can crash).
 * These are not test failures — re-issuing the same navigation recovers —
 * so we retry in-place a bounded number of times. Any other navigation
 * error propagates unchanged, and the retry is narrow enough that normal
 * navigations are untouched.
 */

import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

const TRANSIENT_NAV_CRASH =
  /encountered an internal error|target crashed|page crashed/i;
const GOTO_CRASH_RETRIES = 2;

export const test = base.extend({
  page: async ({ page }, use) => {
    // Disable tutorial by default for all tests
    // This runs before each page navigation
    await page.addInitScript(() => {
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });

    const originalGoto = page.goto.bind(page);
    page.goto = (async (url, options) => {
      let lastError: unknown;
      for (let attempt = 0; attempt <= GOTO_CRASH_RETRIES; attempt++) {
        try {
          return await originalGoto(url, options);
        } catch (error) {
          lastError = error;
          const transient =
            error instanceof Error && TRANSIENT_NAV_CRASH.test(error.message);
          if (!transient) throw error;
        }
      }
      throw lastError;
    }) as Page["goto"];

    await use(page);
  },
});

export { expect } from "@playwright/test";
