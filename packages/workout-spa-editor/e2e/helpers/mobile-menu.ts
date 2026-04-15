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
  // Both DesktopNav and MobileMenuPanel render buttons with the same
  // aria-label. Filter to visible ones to avoid strict mode violations.
  const visible = page
    .getByRole("button", { name: actionName })
    .filter({ visible: true });

  if ((await visible.count()) > 0) {
    await visible.first().click();
    return;
  }

  // On mobile, open the hamburger menu first
  const menuButton = page.getByLabel("Menu");
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    // Wait for dropdown item to become visible instead of fixed delay
    const menuItem = page
      .getByRole("button", { name: actionName })
      .filter({ visible: true })
      .first();
    await menuItem.waitFor({ state: "visible" });
    await menuItem.click();
  }
}
