/**
 * Turn a Capability on through Settings, Capabilities, as the athlete does.
 * Production builds expose no test handle on the database, so specs that run
 * against the built App use this instead of seeding decisions.
 */

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function turnOnCapability(
  page: Page,
  url: (route: string) => string,
  name: RegExp
): Promise<void> {
  await page.goto(url("/settings/capabilities"));
  const toggle = page.getByRole("switch", { name });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
}
