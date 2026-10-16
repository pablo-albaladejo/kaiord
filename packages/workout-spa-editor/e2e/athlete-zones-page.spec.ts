/**
 * E2E: the athlete's zone editor is a page, `/athlete/zones/:sport`.
 * "Adjust zones" on the Athlete page opens it on the active sport, its
 * sport tabs are part of the address (so a reload or a shared link keeps
 * the sport), and an edit made there survives a reload. It replaces the
 * former Profile Manager modal's "Training Zones" tab.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "e2e-zones-page-profile";
const GENERIC_LTHR = "165";

async function seedProfile(page: Page) {
  await page.goto("/athlete");
  await waitForDexieReady(page);
  await page.evaluate(async (profileId) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => {
        put: (r: unknown) => Promise<void>;
        clear: () => Promise<void>;
      };
    };
    const now = new Date().toISOString();
    for (const t of ["profiles", "meta", "userPreferences"]) {
      await db.table(t).clear();
    }
    await db.table("profiles").put({
      id: profileId,
      name: "Zones Athlete",
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
    await db.table("meta").put({ key: "activeProfileId", value: profileId });
    await db
      .table("userPreferences")
      .put({ profileId, calendarView: "grid", updatedAt: now });
  }, PROFILE_ID);
}

function selectedTab(page: Page) {
  return page.getByRole("main").getByRole("tab", { selected: true });
}

test.describe("Athlete zones page", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page);
  });

  test("should open on the active sport from 'Adjust zones'", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/athlete");
    await page
      .getByRole("radiogroup", { name: "Sport" })
      .getByRole("radio", { name: "Running" })
      .click();

    // Act
    await page.getByRole("link", { name: "Adjust zones" }).click();

    // Assert
    await expect(page).toHaveURL(/#\/athlete\/zones\/running$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Running zones" })
    ).toBeVisible();
    await expect(selectedTab(page)).toHaveText("Running");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("should keep the chosen sport in the address across a reload", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/athlete/zones/cycling");
    await expect(selectedTab(page)).toHaveText("Cycling");

    // Act
    await page.getByRole("main").getByRole("tab", { name: "Swimming" }).click();
    await expect(page).toHaveURL(/#\/athlete\/zones\/swimming$/);
    await page.reload();

    // Assert
    await expect(selectedTab(page)).toHaveText("Swimming");
  });

  test("should send an unknown sport to cycling", async ({ page }) => {
    // Act
    await page.goto("/athlete/zones/curling");

    // Assert
    await expect(page).toHaveURL(/#\/athlete\/zones\/cycling$/);
    await expect(selectedTab(page)).toHaveText("Cycling");
  });

  test("should persist an edit made on the page across a reload", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/athlete/zones/generic");
    const lthr = page.getByRole("main").getByLabel(/^LTHR \(bpm\)/);

    // Act — "Saved" is shown once the write has landed.
    await lthr.fill(GENERIC_LTHR);
    await lthr.press("Enter");
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();
    await page.reload();

    // Assert
    await expect(
      page.getByRole("main").getByLabel(/^LTHR \(bpm\)/)
    ).toHaveValue(GENERIC_LTHR);
  });

  test("should lead back to the Athlete page", async ({ page }) => {
    // Arrange
    await page.goto("/athlete/zones/cycling");

    // Act
    await page.getByRole("link", { name: "Athlete", exact: true }).click();

    // Assert
    await expect(page).toHaveURL(/#\/athlete$/);
  });
});
