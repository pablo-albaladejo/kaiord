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
 */

import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Disable tutorial by default for all tests
    // This runs before each page navigation
    await page.addInitScript(() => {
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });

    await use(page);
  },
});

export { expect } from "@playwright/test";
