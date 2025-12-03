/**
 * Test setup utilities for E2E tests
 * Provides helper to disable onboarding tutorial
 */

import { type Page } from "@playwright/test";

/**
 * Disables the onboarding tutorial by setting localStorage flag
 * Call this in beforeEach hooks to skip tutorial in tests
 */
export async function disableOnboardingTutorial(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("workout-spa-onboarding-completed", "true");
  });
}
