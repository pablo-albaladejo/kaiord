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
  // Filter by visible to avoid strict mode violations when both
  // DesktopNav and MobileMenuPanel have buttons with the same aria-label
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
    await page.waitForTimeout(200);
    // After menu opens, the item becomes visible
    await page
      .getByRole("button", { name: actionName })
      .filter({ visible: true })
      .first()
      .click();
  }
}
