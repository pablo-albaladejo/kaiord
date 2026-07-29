/**
 * Reaching a header destination whichever chrome currently owns it.
 *
 * The bar carries an entry directly at `lg`; below that the overflow menu
 * carries it; and a nested destination (Labs) is always behind its parent's
 * dropdown. A spec that clicks `status-header-<id>-button` directly is
 * therefore only correct for the entries that never move.
 */

import type { Page } from "@playwright/test";

const MENU_TRIGGERS = [
  "status-header-trends-button",
  "status-header-more-button",
] as const;

export async function gotoNavDestination(
  page: Page,
  id: string
): Promise<void> {
  const direct = page
    .getByTestId(`status-header-${id}-button`)
    .filter({ visible: true });
  if ((await direct.count()) > 0) {
    await direct.first().click();
    return;
  }

  for (const trigger of MENU_TRIGGERS) {
    const button = page.getByTestId(trigger).filter({ visible: true });
    if ((await button.count()) === 0) continue;
    await button.first().click();
    const item = page
      .getByTestId(`nav-menu-item-${id}`)
      .filter({ visible: true });
    if ((await item.count()) > 0) {
      await item.first().click();
      return;
    }
    await page.keyboard.press("Escape");
  }

  throw new Error(`No header surface currently exposes the "${id}" entry`);
}
