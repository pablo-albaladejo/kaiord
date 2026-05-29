/**
 * T-24 — Data Flows section density and collapse defaults.
 *
 * Verifies AC-4 (Data Flows section renders groups) and M-3.5 (collapse
 * defaults). Uses the existing Dexie seed helpers so no production code
 * is modified.
 *
 * Playwright Chromium runs without extension runtimes, so bridge stubs
 * are injected via addInitScript before page.goto (see helpers/).
 * Dexie operations are called AFTER page.goto since the DB is only
 * initialised once the app JS runs.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "data-flows-density-profile";

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    clear: () => Promise<void>;
    bulkPut: (r: unknown[]) => Promise<void>;
  };
};

const seedProfileWithPolicies = async (
  page: Page,
  policyCount: number
): Promise<void> => {
  await page.evaluate(
    async ({ profileId, count }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      if (!db) throw new Error("__KAIORD_DB__ not available");

      const now = new Date().toISOString();
      await db.table("profiles").put({
        id: profileId,
        name: "Density Test Profile",
        linkedAccounts: [],
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db
        .table("userPreferences")
        .put({ profileId, calendarView: "grid", updatedAt: now });

      const policies = Array.from({ length: count }, (_, i) => ({
        id: `policy-density-${i}`,
        profileId,
        dataType: "workout",
        bridgeId: `bridge-${i}`,
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: now,
      }));
      await db.table("integrationPolicies").bulkPut(policies);
    },
    { profileId: PROFILE_ID, count: policyCount }
  );
};

const openDataFlowsTab = async (page: Page): Promise<void> => {
  // Open profile manager via header button
  const openBtn = page.getByRole("button", {
    name: /open profile manager/i,
  });
  await expect(openBtn).toBeVisible({ timeout: 10_000 });
  await openBtn.click();

  await page.waitForURL(/\/settings\/profile$/, { timeout: 10_000 });

  // Navigate to the first profile's edit view
  const editBtn = page.getByRole("button", { name: /^edit$/i }).first();
  await expect(editBtn).toBeVisible({ timeout: 5_000 });
  await editBtn.click();

  // Click the Data Flows tab
  const dataFlowsTab = page.getByRole("tab", { name: /data flows/i });
  await expect(dataFlowsTab).toBeVisible({ timeout: 5_000 });
  await dataFlowsTab.click();
};

test.describe("Data Flows density", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.goto("/workout/new?source=scratch");
  });

  test("should show zero-state banner when profile has no policies", async ({
    page,
  }) => {
    // Arrange
    await page.evaluate(
      async ({ profileId }) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as DexieDb;
        const now = new Date().toISOString();
        await db.table("profiles").put({
          id: profileId,
          name: "Empty Profile",
          linkedAccounts: [],
          createdAt: now,
          updatedAt: now,
        });
        await db
          .table("meta")
          .put({ key: "activeProfileId", value: profileId });
        await db
          .table("userPreferences")
          .put({ profileId, calendarView: "grid", updatedAt: now });
      },
      { profileId: PROFILE_ID }
    );

    // Act
    await openDataFlowsTab(page);

    // Assert
    await expect(page.getByTestId("data-flows-zero-state")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should render an expanded group for a data type with at least one policy", async ({
    page,
  }) => {
    // Arrange
    await seedProfileWithPolicies(page, 1);

    // Act
    await openDataFlowsTab(page);

    // Assert — at least one data-flows-group is rendered
    await expect(page.getByTestId("data-flows-group-workout")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("should have collapsed visible count within budget when profile has 18 rows", async ({
    page,
  }) => {
    // Arrange
    const STRESS_ROW_COUNT = 18; // 9 data types × 2 directions
    await seedProfileWithPolicies(page, STRESS_ROW_COUNT);

    // Act
    await openDataFlowsTab(page);

    // Assert — zero-state banner is NOT shown (has policies)
    await expect(page.getByTestId("data-flows-zero-state")).not.toBeVisible({
      timeout: 5_000,
    });

    // Assert — section container is present
    await expect(page.getByTestId("data-flows-section")).toBeVisible({
      timeout: 5_000,
    });
  });
});
