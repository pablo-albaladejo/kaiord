/**
 * Manual sleep entry from the Sleep page's "Add data" action: hours slept
 * and a score are stored as a real night (not a 0 h session), the Sleep
 * page shows the duration, and Daily's readiness says the score was typed
 * in rather than crediting overnight HRV.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const clearSleep = (page: Page) =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { clear: () => Promise<void> };
    };
    await db.table("healthSleep").clear();
  });

test.describe("Manual sleep entry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/health/sleep");
    await waitForDexieReady(page);
    await clearDexie(page);
    await clearSleep(page);
    await page.goto("/health/sleep");
    await expect(page.getByTestId("health-sleep")).toBeVisible();
  });

  test("should store hours and score as a real night with an honest readiness", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add data" }).click();
    const dialog = page.getByTestId("wellness-entry-dialog");
    await expect(dialog.getByLabel("Sleep hours (h:mm)")).toBeFocused();
    await dialog.getByLabel("Sleep hours (h:mm)").fill("7:30");
    await dialog.getByLabel("Sleep score").fill("81");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toBeHidden();

    const row = page.getByTestId("sleep-night-row");
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("7 h 30 m");
    await expect(row).toContainText("Score 81");
    await expect(row).not.toContainText("0 h 0 m");
    const date = (await row.locator("span").first().innerText()).trim();

    await page.goto(`/daily?date=${date}`);
    const daily = page.getByTestId("daily-page");
    await expect(daily).toContainText("Based on the sleep score you entered.");
    await expect(daily).not.toContainText("Based on your overnight HRV");
    await expect(daily).toContainText("7.5h");
  });
});
