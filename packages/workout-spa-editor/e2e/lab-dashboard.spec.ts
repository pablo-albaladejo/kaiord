/**
 * F5 E2E: with three recorded parameters, pinning all three to the labs
 * dashboard renders three evolution chart cards at once, and the pinned
 * selection survives a reload — read from `userPreferences.labDashboardParams`
 * (no new Dexie version, OQ2/S3). Seeding writes the v31 tables directly via
 * `__KAIORD_DB__`, mirroring `lab-history.spec.ts`.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "labs-dashboard-profile";
const DATE = "2026-01-01";
const PARAMETER_KEYS = ["glucose", "ferritin", "creatinine"];

async function seed(page: Page) {
  await page.evaluate(
    async ({ profileId, date, keys }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          put: (r: unknown) => Promise<void>;
          bulkPut: (r: unknown[]) => Promise<void>;
          clear: () => Promise<void>;
        };
      };
      if (!db) throw new Error("__KAIORD_DB__ not available");
      const now = new Date().toISOString();
      for (const t of ["profiles", "meta", "labReports", "labValues"]) {
        await db.table(t).clear();
      }
      await db.table("profiles").put({
        id: profileId,
        name: "Labs Dashboard Athlete",
        linkedAccounts: [],
        sportZones: {},
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db.table("labReports").put({
        id: "r1",
        profileId,
        date,
        labName: "Lab",
        provenance: { source: "manual" },
      });
      await db.table("labValues").bulkPut(
        keys.map((parameterKey, i) => ({
          id: `v${i}`,
          profileId,
          reportId: "r1",
          parameterKey,
          date,
          valueRaw: 90,
          unitRaw: "mg/dL",
          valueCanonical: 90,
          unitCanonical: "mg/dL",
          refSource: "none",
          flag: "in",
          provenance: { source: "manual" },
        }))
      );
    },
    { profileId: PROFILE_ID, date: DATE, keys: PARAMETER_KEYS }
  );
}

async function gotoDashboard(page: Page) {
  await page.goto("/health/labs");
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );
  await seed(page);
  await page.goto("/health/labs");
  await expect(page.getByTestId("health-labs")).toBeVisible({
    timeout: 10_000,
  });
  await page.getByTestId("lab-tab-dashboard").click();
  await expect(page.getByTestId("lab-dashboard")).toBeVisible();
}

async function pinAll(page: Page) {
  for (const key of PARAMETER_KEYS) {
    await page
      .locator(
        `[data-parameter-key="${key}"] [data-testid="lab-parameter-select"]`
      )
      .click();
  }
}

test.describe("Lab dashboard (F5)", () => {
  test("should show three evolution charts at once after pinning three parameters", async ({
    page,
  }) => {
    // Arrange
    await gotoDashboard(page);

    // Act
    await pinAll(page);

    // Assert
    await expect(
      page
        .getByTestId("lab-dashboard-grid")
        .getByTestId("lab-parameter-chart-card")
    ).toHaveCount(PARAMETER_KEYS.length);
  });

  test("should persist the pinned selection across a reload", async ({
    page,
  }) => {
    // Arrange
    await gotoDashboard(page);
    await pinAll(page);
    await expect(
      page
        .getByTestId("lab-dashboard-grid")
        .getByTestId("lab-parameter-chart-card")
    ).toHaveCount(PARAMETER_KEYS.length);

    // Act
    await page.reload();
    await expect(page.getByTestId("health-labs")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("lab-tab-dashboard").click();

    // Assert
    await expect(
      page
        .getByTestId("lab-dashboard-grid")
        .getByTestId("lab-parameter-chart-card")
    ).toHaveCount(PARAMETER_KEYS.length);
  });

  test("should remove a chart when its parameter is unpinned", async ({
    page,
  }) => {
    // Arrange
    await gotoDashboard(page);
    await pinAll(page);
    await expect(
      page
        .getByTestId("lab-dashboard-grid")
        .getByTestId("lab-parameter-chart-card")
    ).toHaveCount(PARAMETER_KEYS.length);

    // Act
    await page
      .locator(
        '[data-parameter-key="glucose"] [data-testid="lab-parameter-select"]'
      )
      .click();

    // Assert
    await expect(
      page
        .getByTestId("lab-dashboard-grid")
        .getByTestId("lab-parameter-chart-card")
    ).toHaveCount(PARAMETER_KEYS.length - 1);
  });
});
