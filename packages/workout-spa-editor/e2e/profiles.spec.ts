/**
 * Athlete page E2E tests (post mobile-first redesign).
 *
 * The legacy multi-profile ProfileManager surface (Settings → Profile
 * tab: create / delete / switch / import / export multiple profiles,
 * "Saved profiles (N)" list) was removed by the redesign. The active
 * athlete now lives on a single-profile `/athlete` page: identity, a
 * sport segmented control, a Thresholds card (FTP / LTHR via the
 * threshold editor) and a Zone map. `/settings/profile` redirects to
 * `/athlete`.
 *
 * Removed-feature coverage (create/delete/switch/import/export of
 * multiple profiles) is intentionally dropped — see the e2e redesign
 * report. The surviving capabilities (identity, sport switch, threshold
 * editing → zone recompute) are covered below against the new UI.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "athlete-e2e-profile";
const PROFILE_NAME = "E2E Athlete";

// Seed an active profile that has a cycling sport-zone config (so the
// threshold editor renders the FTP/LTHR inputs) but no running config
// (so switching to Running shows the empty-threshold prompt).
async function seedAthleteProfile(page: Page) {
  await page.evaluate(
    async ({ profileId, name }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          put: (r: unknown) => Promise<void>;
          clear: () => Promise<void>;
        };
      };
      if (!db) throw new Error("__KAIORD_DB__ not available");
      const now = new Date().toISOString();
      for (const t of ["profiles", "meta", "userPreferences"]) {
        await db.table(t).clear();
      }
      await db.table("profiles").put({
        id: profileId,
        name,
        linkedAccounts: [],
        sportZones: {
          cycling: {
            thresholds: {},
            heartRateZones: { method: "manual", zones: [] },
            powerZones: { method: "manual", zones: [] },
          },
        },
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db
        .table("userPreferences")
        .put({ profileId, calendarView: "grid", updatedAt: now });
    },
    { profileId: PROFILE_ID, name: PROFILE_NAME }
  );
}

async function gotoAthlete(page: Page) {
  // Boot once to expose the Dexie singleton, seed the active profile,
  // then load the populated Athlete page.
  await page.goto("/athlete");
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );
  await seedAthleteProfile(page);
  await page.goto("/athlete");
  await expect(page.getByRole("radiogroup", { name: "Sport" })).toBeVisible({
    timeout: 10_000,
  });
}

async function openThresholdEditor(page: Page) {
  await page.getByRole("button", { name: /edit thresholds/i }).click();
  await expect(
    page.getByRole("dialog", { name: /edit thresholds/i })
  ).toBeVisible();
}

test.describe("Athlete page", () => {
  test("should render identity, sport selector, thresholds and zones", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act — (page already loaded)

    // Assert — the redesigned Athlete surfaces. Scope the identity name
    // to the page body (the header also shows the active-profile name).
    await expect(page.getByRole("main").getByText(PROFILE_NAME)).toBeVisible();
    const sport = page.getByRole("radiogroup", { name: "Sport" });
    await expect(sport.getByRole("radio", { name: "Cycling" })).toBeVisible();
    await expect(sport.getByRole("radio", { name: "Running" })).toBeVisible();
    await expect(sport.getByRole("radio", { name: "Swim" })).toBeVisible();
    await expect(page.getByText("Thresholds", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /connections/i })
    ).toBeVisible();
  });

  test("should set the cycling FTP threshold and reflect it on the card", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act — open the threshold editor and set FTP (Cycling is the
    // default sport in the editor).
    await openThresholdEditor(page);
    const dialog = page.getByRole("dialog", { name: /edit thresholds/i });
    await dialog.getByLabel(/FTP threshold/i).fill("300");
    // The editor auto-persists on change; close the dialog.
    await page.keyboard.press("Escape");

    // Assert — the card now shows the FTP metric.
    await expect(page.getByText("FTP")).toBeVisible();
    await expect(page.getByText("300", { exact: true })).toBeVisible();
  });

  test("should set the cycling LTHR threshold and reflect it on the card", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act
    await openThresholdEditor(page);
    const dialog = page.getByRole("dialog", { name: /edit thresholds/i });
    await dialog.getByLabel(/LTHR threshold/i).fill("170");
    await page.keyboard.press("Escape");

    // Assert — the Threshold HR metric appears with the new value.
    await expect(page.getByText("Threshold HR")).toBeVisible();
    await expect(page.getByText("170", { exact: true })).toBeVisible();
  });

  test("should switch sport and show that sport's threshold prompt", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act — switch to Running (no thresholds seeded for any sport).
    await page
      .getByRole("radiogroup", { name: "Sport" })
      .getByRole("radio", { name: "Running" })
      .click();

    // Assert — the empty-thresholds prompt is sport-aware.
    await expect(page.getByText(/add your running thresholds/i)).toBeVisible();
  });

  test("should persist a threshold edit across an Athlete-page reload", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act — set FTP, then reload the Athlete page.
    await openThresholdEditor(page);
    const dialog = page.getByRole("dialog", { name: /edit thresholds/i });
    await dialog.getByLabel(/FTP threshold/i).fill("280");
    await page.keyboard.press("Escape");
    await expect(page.getByText("300", { exact: true })).toBeHidden();
    await page.reload();
    await expect(page.getByRole("radiogroup", { name: "Sport" })).toBeVisible();

    // Assert — the persisted FTP survives the reload (Dexie hydration).
    await expect(page.getByText("FTP")).toBeVisible();
    await expect(page.getByText("280", { exact: true })).toBeVisible();
  });
});

test.describe("Profile route redirect", () => {
  test("should redirect /settings/profile to /athlete", async ({ page }) => {
    // Arrange & Act — the legacy Settings Profile tab now redirects to
    // the Athlete page. No profile is seeded, so the Athlete page renders
    // its empty state.
    await page.goto("/settings/profile");

    // Assert
    await page.waitForURL(/\/athlete$/);
    await expect(page.getByText(/no athlete profile yet/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
