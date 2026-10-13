/**
 * Athlete page E2E tests (post mobile-first redesign).
 *
 * The legacy multi-profile ProfileManager surface (Settings → Profile
 * tab: create / delete / switch / import / export multiple profiles,
 * "Saved profiles (N)" list) was removed by the redesign. The active
 * athlete now lives on a single-profile `/athlete` page: identity, a
 * sport segmented control, a sport-scoped thresholds card (FTP / LTHR /
 * max HR edited in place, each carrying where its number came from) and a
 * zone map under the reason it exists; the zone editor itself is
 * `/athlete/zones/:sport` (athlete-zones-page.spec.ts). `/settings/profile` redirects
 * to `/athlete`.
 *
 * Text assertions here lean on `exact`: a threshold's label and value now
 * also appear inside the identity tagline and the zones reason, so a bare
 * substring match would hit several elements and trip strict mode.
 *
 * Removed-feature coverage (create/delete/switch/import/export of
 * multiple profiles) is intentionally dropped — see the e2e redesign
 * report. The surviving capabilities (identity, sport switch, threshold
 * editing → zone recompute) are covered below against the new UI.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "athlete-e2e-profile";
const PROFILE_NAME = "E2E Athlete";

// Seed an active profile that has a cycling sport-zone config but no
// running config (switching to Running still shows its fields).
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
  await waitForDexieReady(page);
  await seedAthleteProfile(page);
  await page.goto("/athlete");
  await expect(page.getByRole("radiogroup", { name: "Sport" })).toBeVisible({
    timeout: 10_000,
  });
}

// Thresholds are edited in place: a field saves on Enter (or blur) and the
// card says "Saved" once the write has landed.
async function setThreshold(page: Page, label: RegExp, value: string) {
  const card = page.getByTestId("athlete-thresholds");
  const field = card.getByLabel(label);
  await field.fill(value);
  await field.press("Enter");
  await expect(card.getByText("Saved", { exact: true })).toBeVisible();
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
    // Both cards are titled by a sport-scoped section head.
    await expect(
      page.getByRole("heading", { name: /cycling thresholds/i })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /cycling zones/i })
    ).toBeVisible();
    // The Connections section was retired into /connections; the Athlete
    // page only links there, it does not grow a second list.
    await expect(
      page.getByRole("heading", { name: /connections/i })
    ).toHaveCount(0);
  });

  test("should edit thresholds in place, with no dialog", async ({ page }) => {
    // Arrange
    await gotoAthlete(page);

    // Act
    await setThreshold(page, /^FTP \(W\)/, "300");

    // Assert
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Edit", exact: true })
    ).toHaveCount(0);
  });

  test("should state the reason for the zones above the map", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act
    await setThreshold(page, /^FTP \(W\)/, "300");

    // Assert — the reason names the threshold the bands derive from.
    await expect(page.getByText(/derived from FTP 300 W\./i)).toBeVisible();
  });

  test("should report a hand-typed threshold as entered by hand", async ({
    page,
  }) => {
    // Arrange — no linked account, so nothing can have synced this value.
    await gotoAthlete(page);

    // Act
    await setThreshold(page, /^FTP \(W\)/, "300");

    // Assert — provenance is stated, and stays silent about an age it
    // cannot prove (the profile was written seconds ago).
    await expect(page.getByText("By hand").first()).toBeVisible();
  });

  test("should set the cycling LTHR threshold and keep it in the field", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act
    await setThreshold(page, /^LTHR \(bpm\)/, "170");

    // Assert
    await expect(
      page.getByTestId("athlete-thresholds").getByLabel(/^LTHR \(bpm\)/)
    ).toHaveValue("170");
  });

  test("should switch sport and show that sport's thresholds", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act — switch to Running (no thresholds seeded for any sport).
    await page
      .getByRole("radiogroup", { name: "Sport" })
      .getByRole("radio", { name: "Running" })
      .click();

    // Assert — a runner's thresholds lead with pace; power is optional.
    const card = page.getByTestId("athlete-thresholds");
    await expect(card.getByLabel(/^Threshold pace/)).toBeVisible();
    await expect(card.getByText("Optional for running")).toBeVisible();
  });

  test("should persist a threshold edit across an Athlete-page reload", async ({
    page,
  }) => {
    // Arrange
    await gotoAthlete(page);

    // Act — "Saved" is shown once the write has landed, so the reload
    // cannot hydrate the pre-edit profile.
    await setThreshold(page, /^FTP \(W\)/, "280");
    await page.reload();
    await expect(page.getByRole("radiogroup", { name: "Sport" })).toBeVisible();

    // Assert — the persisted FTP survives the reload (Dexie hydration).
    await expect(
      page.getByTestId("athlete-thresholds").getByLabel(/^FTP \(W\)/)
    ).toHaveValue("280");
  });
});

test.describe("Profile route redirect", () => {
  test("should redirect /settings/profile to /athlete", async ({ page }) => {
    // Arrange & Act — the legacy Settings Profile tab now redirects to
    // the Athlete page. No profile is seeded, so the Athlete page shows the
    // first-run default profile the app creates on a clean browser.
    await page.goto("/settings/profile");

    // Assert
    await page.waitForURL(/\/athlete$/);
    // Exact: the first-run notice also quotes the name ("We created “My
    // profile”…"), so a substring match is ambiguous once both have rendered.
    await expect(
      page.getByRole("main").getByText("My profile", { exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });
});
