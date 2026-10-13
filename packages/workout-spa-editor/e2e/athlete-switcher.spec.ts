/**
 * Avatar-menu athlete switcher (audit P-06): switching profile is one open
 * plus one pick instead of four clicks inside the Profile Manager modal.
 *
 * Opens the menu through the shared `openAccountMenu` helper (it waits for
 * the content to be visible) and picks with a plain click, so no step races
 * a scroll animation.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { openAccountMenu } from "./helpers/mobile-menu";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const SECOND_NAME = "Laura Second";

async function seedSecondProfile(page: Page) {
  await page.evaluate(async (name) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { put: (r: unknown) => Promise<void> };
    };
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: "athlete-switcher-second",
      name,
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
  }, SECOND_NAME);
}

test.describe("Avatar menu athlete switcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/athlete");
    await waitForDexieReady(page);
    await clearDexie(page);
    await seedSecondProfile(page);
    await page.goto("/athlete");
    await expect(
      page.getByText("E2E Default Profile", { exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("switches the active athlete from the avatar menu", async ({ page }) => {
    await openAccountMenu(page);
    const menu = page.getByTestId("account-menu");
    await expect(
      menu.getByRole("menuitemradio", { name: "E2E Default Profile" })
    ).toBeChecked();

    await menu.getByRole("menuitemradio", { name: SECOND_NAME }).click();

    await expect(page.getByTestId("account-menu")).toBeHidden();
    await expect(page.getByText(SECOND_NAME, { exact: true })).toBeVisible();
    await expect(
      page.getByTestId("status-header-account-button")
    ).toHaveAccessibleName(`Account menu (${SECOND_NAME})`);
  });

  test("keeps the menu inside the viewport", async ({ page }) => {
    await openAccountMenu(page);

    const box = await page.getByTestId("account-menu").boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  });

  test("switches by keyboard", async ({ page }) => {
    await openAccountMenu(page);
    const second = page
      .getByTestId("account-menu")
      .getByRole("menuitemradio", { name: SECOND_NAME });
    await second.focus();
    await expect(second).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(page.getByText(SECOND_NAME, { exact: true })).toBeVisible();
  });

  test("opens the profile manager from Manage athletes", async ({ page }) => {
    await openAccountMenu(page);

    await page
      .getByTestId("account-menu")
      .getByRole("menuitem", { name: "Manage athletes…" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Manage athletes" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Saved Profiles (2)")).toBeVisible();
  });
});
