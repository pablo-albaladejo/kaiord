/**
 * DoD-2 E2E: with three analyses of one parameter on different dates (each
 * carrying a canonical reference range, one out of range), the /health/labs
 * page opens the parameter's evolution chart with a reference band drawn from
 * the canonical bounds and the out-of-range point marked. Seeding writes the
 * v31 tables directly via `__KAIORD_DB__`, mirroring `lab-history.spec.ts`.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "labs-evolution-profile";
const REF_LOW = 70;
const REF_HIGH = 100;
const EXPECTED_POINTS = 3;

type SeedValue = {
  id: string;
  reportId: string;
  date: string;
  valueCanonical: number;
  flag: string;
};

const REPORTS = [
  { id: "r1", date: "2026-01-01" },
  { id: "r2", date: "2026-02-01" },
  { id: "r3", date: "2026-03-01" },
];

const VALUES: SeedValue[] = [
  {
    id: "v1",
    reportId: "r1",
    date: "2026-01-01",
    valueCanonical: 85,
    flag: "in",
  },
  {
    id: "v2",
    reportId: "r2",
    date: "2026-02-01",
    valueCanonical: 95,
    flag: "in",
  },
  {
    id: "v3",
    reportId: "r3",
    date: "2026-03-01",
    valueCanonical: 130,
    flag: "high",
  },
];

type SeedOpts = {
  parameterKey: string;
  refLow: number | null;
  refHigh: number | null;
};

async function seed(page: Page, opts: SeedOpts) {
  await page.evaluate(
    async ({ profileId, reports, values, parameterKey, refLow, refHigh }) => {
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
        name: "Labs Evolution Athlete",
        linkedAccounts: [],
        sportZones: {},
        createdAt: now,
        updatedAt: now,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      await db.table("labReports").bulkPut(
        reports.map((r) => ({
          id: r.id,
          profileId,
          date: r.date,
          labName: "Lab",
          provenance: { source: "manual" },
        }))
      );
      await db.table("labValues").bulkPut(
        values.map((v) => ({
          profileId,
          parameterKey,
          unitRaw: "mg/dL",
          valueRaw: v.valueCanonical,
          unitCanonical: "mg/dL",
          provenance: { source: "manual" },
          refSource: "report",
          ...(refLow != null ? { refLowCanonical: refLow } : {}),
          ...(refHigh != null ? { refHighCanonical: refHigh } : {}),
          ...v,
        }))
      );
    },
    {
      profileId: PROFILE_ID,
      reports: REPORTS,
      values: VALUES,
      parameterKey: opts.parameterKey,
      refLow: opts.refLow,
      refHigh: opts.refHigh,
    }
  );
}

async function gotoLabs(page: Page, opts: SeedOpts) {
  await page.goto("/health/labs");
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );
  await seed(page, opts);
  await page.goto("/health/labs");
  await expect(page.getByTestId("lab-history")).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Lab parameter evolution (F4 / DoD-2)", () => {
  test("should open a parameter chart with a reference band and a marked out-of-range point", async ({
    page,
  }) => {
    // Arrange
    await gotoLabs(page, {
      parameterKey: "glucose",
      refLow: REF_LOW,
      refHigh: REF_HIGH,
    });

    // Act
    await page
      .locator(
        '[data-parameter-key="glucose"] [data-testid="lab-parameter-select"]'
      )
      .click();

    // Assert
    const chart = page.getByTestId("lab-parameter-chart");
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute("data-has-band", "true");
    await expect(chart).toHaveAttribute("data-band-kind", "band");
    await expect(chart).toHaveAttribute(
      "data-point-count",
      String(EXPECTED_POINTS)
    );
    await expect(chart).toHaveAttribute("data-outlier-count", "1");
    await expect(chart.getByTestId("uplot-chart")).toBeVisible();
  });

  test("should draw a one-sided threshold reference for a high-only lipid", async ({
    page,
  }) => {
    // Arrange
    await gotoLabs(page, {
      parameterKey: "ldl",
      refLow: null,
      refHigh: REF_HIGH,
    });

    // Act
    await page
      .locator(
        '[data-parameter-key="ldl"] [data-testid="lab-parameter-select"]'
      )
      .click();

    // Assert
    const chart = page.getByTestId("lab-parameter-chart");
    await expect(chart).toBeVisible();
    await expect(chart).toHaveAttribute("data-has-band", "true");
    await expect(chart).toHaveAttribute("data-band-kind", "threshold");
    await expect(chart).toHaveAttribute("data-outlier-count", "1");
  });
});
