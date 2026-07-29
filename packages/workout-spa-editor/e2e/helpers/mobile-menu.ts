/**
 * Helper to open header nav actions on mobile.
 *
 * On mobile (<sm), nav items are inside a hamburger menu.
 * On desktop, the button is directly visible.
 * This helper handles both cases transparently.
 */

import type { Page } from "@playwright/test";

export async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  const menuBtn = page.getByLabel("Menu", { exact: true });
  if (await menuBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await menuBtn.click();
  }
}

/**
 * Opens a header nav action, resilient to the responsive nav surfaces.
 *
 * - Desktop: the header button is directly visible — click it.
 * - Legacy hamburger surfaces: open the "Menu" panel, then click the item.
 * - Mobile (post-redesign): the header entry is hidden below `md` and the
 *   destination lives in the floating BottomNav, whose tabs use their short
 *   visible label as the accessible name and ignore the header's aria
 *   override (see `nav-destinations.ts`). Pass `bottomNavName` (e.g.
 *   /library/i) so the helper can reach the tab when the header entry is
 *   hidden.
 * - Account-level destinations (Settings, Connections): these left the nav
 *   bar for the avatar menu, so they are `menuitem`s behind a trigger at
 *   every width, not buttons. Checked last, because opening a menu to find
 *   nothing is the expensive branch.
 */
export async function openHeaderAction(
  page: Page,
  actionName: string | RegExp,
  bottomNavName?: string | RegExp
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

  // Legacy hamburger surface, if one is still mounted. `exact` matters:
  // `getByLabel` is a case-insensitive SUBSTRING match by default, so the
  // avatar trigger's "Account menu (…)" label lands in this branch and the
  // helper opens the account menu, then hunts for a `button` in a list of
  // `menuitem`s.
  const menuButton = page.getByLabel("Menu", { exact: true });
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click();
    // Wait for dropdown item to become visible instead of fixed delay
    const menuItem = page
      .getByRole("button", { name: actionName })
      .filter({ visible: true })
      .first();
    await menuItem.waitFor({ state: "visible" });
    await menuItem.click();
    return;
  }

  // Mobile: the header entry is hidden; reach the destination via BottomNav.
  if (bottomNavName) {
    await page
      .getByTestId("bottom-nav")
      .getByRole("button", { name: bottomNavName })
      .click();
    return;
  }

  await openAccountMenuAction(page, actionName);
}

/** Opens the avatar menu and activates the row with this accessible name. */
async function openAccountMenuAction(
  page: Page,
  actionName: string | RegExp
): Promise<void> {
  const trigger = page.getByTestId("status-header-account-button");
  if (!(await trigger.isVisible().catch(() => false))) return;
  await trigger.click();
  const item = page
    .getByRole("menuitem", { name: actionName })
    .filter({ visible: true })
    .first();
  await item.waitFor({ state: "visible" });
  await item.click();
}

/**
 * Opens the avatar menu and returns once its content is on screen. Settings,
 * Connections, the docs link and the theme toggle all live behind it.
 */
export async function openAccountMenu(page: Page): Promise<void> {
  await page.getByTestId("status-header-account-button").click();
  await page.getByTestId("account-menu").waitFor({ state: "visible" });
}
