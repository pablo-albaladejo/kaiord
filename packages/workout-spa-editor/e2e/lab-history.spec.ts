/**
 * F3 E2E: with two saved analyses on different dates (one parameter measured
 * only in the older report), the /health/labs page shows the latest value per
 * parameter with a rendered sparkline (F3.1) and out-of-range highlighting
 * (DoD-4), opens a past report's full review (DoD-3), and deletes an analysis
 * with confirmation (F3.4). Seeding writes the v31 tables directly via
 * `__KAIORD_DB__`, mirroring `lab-entry.spec.ts`.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "labs-history-profile";
const OLD_DATE = "2026-01-01";
const NEW_DATE = "2026-03-01";
const DISTINCT_PARAMETERS = 3; // glucose, ferritin, creatinine

type SeedValue = {
  id: string;
  reportId: string;
  parameterKey: string;
  date: string;
  valueCanonical: number;
  flag: string;
  refSource?: string;
  refLowCanonical?: number;
  refHighCanonical?: number;
};

const VALUES: SeedValue[] = [
  {
    id: "v1",
    reportId: "r-old",
    parameterKey: "glucose",
    date: OLD_DATE,
    valueCanonical: 90,
    flag: "in",
  },
  {
    id: "v2",
    reportId: "r-new",
    parameterKey: "glucose",
    date: NEW_DATE,
    valueCanonical: 95,
    flag: "in",
  },
  {
    id: "v3",
    reportId: "r-old",
    parameterKey: "ferritin",
    date: OLD_DATE,
    valueCanonical: 320,
    flag: "high",
  },
  {
    id: "v4",
    reportId: "r-new",
    parameterKey: "creatinine",
    date: NEW_DATE,
    valueCanonical: 1.4,
    flag: "high",
    refSource: "report",
    refLowCanonical: 0.6,
    refHighCanonical: 1.1,
  },
];

async function seed(page: Page) {
  await page.evaluate(
    async ({ profileId, oldDate, newDate, values }) => {
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
        name: "Labs History Athlete",
        linkedAccounts: [],
        sportZones: {},
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db.table("labReports").bulkPut([
        {
          id: "r-old",
          profileId,
          date: oldDate,
          labName: "Old Lab",
          provenance: { source: "manual" },
        },
        {
          id: "r-new",
          profileId,
          date: newDate,
          labName: "New Lab",
          provenance: { source: "manual" },
        },
      ]);
      await db.table("labValues").bulkPut(
        values.map((v) => ({
          profileId,
          unitRaw: "mg/dL",
          valueRaw: v.valueCanonical,
          unitCanonical: "mg/dL",
          provenance: { source: "manual" },
          refSource: v.refSource ?? "none",
          ...v,
        }))
      );
    },
    {
      profileId: PROFILE_ID,
      oldDate: OLD_DATE,
      newDate: NEW_DATE,
      values: VALUES,
    }
  );
}

async function gotoLabHistory(page: Page) {
  await page.goto("/health/labs");
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );
  await seed(page);
  await page.goto("/health/labs");
  await expect(page.getByTestId("lab-history")).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Lab analytics history (F3 / DoD-3, DoD-4)", () => {
  test("should show latest-per-parameter with sparkline and out-of-range flags", async ({
    page,
  }) => {
    // Arrange
    await gotoLabHistory(page);

    // Act
    const items = page.getByTestId("lab-parameter-item");

    // Assert — includes the ferritin measured only in the older report (DoD-4).
    await expect(items).toHaveCount(DISTINCT_PARAMETERS);
    await expect(page.locator('[data-parameter-key="ferritin"]')).toBeVisible();
    await expect(page.getByTestId("sparkline").first()).toBeVisible();
    await expect(
      page
        .locator('[data-testid="lab-parameter-item"][data-flag="high"]')
        .first()
    ).toBeVisible();
  });

  test("should open a past report's full review (DoD-3)", async ({ page }) => {
    // Arrange
    await gotoLabHistory(page);

    // Act
    await page.getByText(OLD_DATE).click();

    // Assert
    const review = page.getByTestId("lab-report-review");
    await expect(review).toHaveAttribute("data-report-id", "r-old");
    await expect(review.getByTestId("lab-review-value")).toHaveCount(2);
  });

  test("should delete an analysis with confirmation (F3.4)", async ({
    page,
  }) => {
    // Arrange
    await gotoLabHistory(page);
    await expect(page.getByTestId("lab-report-row")).toHaveCount(2);
    const newRow = page
      .getByTestId("lab-report-row")
      .filter({ hasText: NEW_DATE });

    // Act
    await newRow.getByRole("button", { name: /Delete report/ }).click();
    await newRow.getByRole("button", { name: "Confirm" }).click();

    // Assert
    await expect(page.getByTestId("lab-report-row")).toHaveCount(1);
    await expect(
      page.getByTestId("lab-report-row").filter({ hasText: NEW_DATE })
    ).toHaveCount(0);
  });
});
