/**
 * E2E: language and units belong to this device, not to the athlete.
 *
 * Choosing Spanish + Imperial and then activating another athlete must leave
 * the app in Spanish and imperial, even though that athlete's synced profile
 * row still carries English + Metric from an older version of the app.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { clearDexie } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const SECOND_ID = "e2e-second-athlete";
const SECOND_NAME = "Second Athlete";

type DexieDb = {
  table: (n: string) => { put: (r: unknown) => Promise<void> };
};

async function createAndActivateSecondProfile(page: Page): Promise<void> {
  await page.evaluate(
    async ({ id, name }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      const now = new Date().toISOString();
      await db.table("profiles").put({
        id,
        name,
        linkedAccounts: [],
        sportZones: {},
        createdAt: now,
        updatedAt: now,
      });
      await db.table("userPreferences").put({
        profileId: id,
        calendarView: "grid",
        units: "metric",
        locale: "en",
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: id });
    },
    { id: SECOND_ID, name: SECOND_NAME }
  );
}

const preferences = (page: Page) => page.getByTestId("settings-preferences");

async function expectSpanishAndImperial(page: Page): Promise<void> {
  await expect(
    preferences(page)
      .getByRole("radiogroup", { name: "Idioma" })
      .getByRole("radio", { name: "Español" })
  ).toHaveAttribute("aria-checked", "true");
  await expect(
    preferences(page)
      .getByRole("radiogroup", { name: "Unidades" })
      .getByRole("radio", { name: "Imperial" })
  ).toHaveAttribute("aria-checked", "true");
}

test.describe("Device preferences", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/preferences");
    await waitForDexieReady(page);
    await clearDexie(page);
    await page.goto("/settings/preferences");
  });

  test("should keep Spanish and imperial after activating another athlete", async ({
    page,
  }) => {
    // Arrange
    await preferences(page)
      .getByRole("radiogroup", { name: "Units" })
      .getByRole("radio", { name: "Imperial" })
      .click();
    await preferences(page)
      .getByRole("radiogroup", { name: "Language" })
      .getByRole("radio", { name: "Spanish" })
      .click();
    await expect(
      preferences(page).getByRole("radiogroup", { name: "Idioma" })
    ).toBeVisible();

    // Act
    await createAndActivateSecondProfile(page);
    await expect(
      page.getByRole("button", { name: new RegExp(SECOND_NAME) })
    ).toBeVisible();

    // Assert
    await expectSpanishAndImperial(page);
    await page.reload();
    await expectSpanishAndImperial(page);
  });
});
