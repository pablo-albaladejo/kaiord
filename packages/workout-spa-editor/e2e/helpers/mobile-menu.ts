/**
 * Helper to open header nav actions on mobile.
 *
 * On mobile (<sm), nav items are inside a hamburger menu.
 * On desktop, the button is directly visible.
 * This helper handles both cases transparently.
 */

import type { Page } from "@playwright/test";

export async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  const menuBtn = page.getByLabel("Menu");
  if (await menuBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await menuBtn.click();
  }
}

/**
 * Opens a header nav action, handling the hamburger menu on mobile.
 *
 * On desktop: the button is directly visible, just click it.
 * On mobile: open the hamburger menu first, then click the item.
 */
export async function openHeaderAction(
  page: Page,
  actionName: string | RegExp
): Promise<void> {
  const directButton = page.getByRole("button", { name: actionName });

  if (await directButton.isVisible().catch(() => false)) {
    await directButton.click();
    return;
  }

  // On mobile, open the hamburger menu first
  const menuButton = page.getByLabel("Menu");
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    // Wait for the dropdown to appear
    await page.waitForTimeout(200);
    // Now find and click the action in the dropdown
    const menuItem = page.getByRole("button", { name: actionName });
    await menuItem.click();
  }
}
