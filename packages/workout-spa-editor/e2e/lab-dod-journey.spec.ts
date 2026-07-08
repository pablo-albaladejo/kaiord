/**
 * F5.2 E2E: cohesion check for the 4 V1 DoD scenes in one continuous
 * session — introduce a new analysis by form (DoD-1), open a parameter's
 * evolution chart with a reference band (DoD-2), review a past report
 * (DoD-3), spot an out-of-range parameter at a glance (DoD-4), then pin
 * charts to the F5 dashboard. Two historical reports are seeded directly via
 * `__KAIORD_DB__` (mirroring `lab-evolution.spec.ts`/`lab-history.spec.ts`)
 * so the evolution chart and the out-of-range flag have real history before
 * the form adds a third glucose point.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "labs-dod-journey-profile";
const OLD_DATE = "2026-01-01";
const MID_DATE = "2026-02-01";
const NEW_DATE = "2026-03-01";
const GLUCOSE_REF_LOW = 70;
const GLUCOSE_REF_HIGH = 100;
const EXPECTED_GLUCOSE_POINTS = 3;

async function seedHistory(page: Page) {
  await page.evaluate(
    async ({ profileId, oldDate, midDate, refLow, refHigh }) => {
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
        name: "Labs DoD Journey Athlete",
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
          id: "r-mid",
          profileId,
          date: midDate,
          labName: "Mid Lab",
          provenance: { source: "manual" },
        },
      ]);
      await db.table("labValues").bulkPut([
        {
          id: "v-glucose-old",
          profileId,
          reportId: "r-old",
          parameterKey: "glucose",
          date: oldDate,
          valueRaw: 85,
          unitRaw: "mg/dL",
          valueCanonical: 85,
          unitCanonical: "mg/dL",
          refSource: "report",
          refLowCanonical: refLow,
          refHighCanonical: refHigh,
          flag: "in",
          provenance: { source: "manual" },
        },
        {
          id: "v-glucose-mid",
          profileId,
          reportId: "r-mid",
          parameterKey: "glucose",
          date: midDate,
          valueRaw: 95,
          unitRaw: "mg/dL",
          valueCanonical: 95,
          unitCanonical: "mg/dL",
          refSource: "report",
          refLowCanonical: refLow,
          refHighCanonical: refHigh,
          flag: "in",
          provenance: { source: "manual" },
        },
        {
          id: "v-ferritin-old",
          profileId,
          reportId: "r-old",
          parameterKey: "ferritin",
          date: oldDate,
          valueRaw: 320,
          unitRaw: "ng/mL",
          valueCanonical: 320,
          unitCanonical: "ng/mL",
          refSource: "catalog",
          flag: "high",
          provenance: { source: "manual" },
        },
      ]);
    },
    {
      profileId: PROFILE_ID,
      oldDate: OLD_DATE,
      midDate: MID_DATE,
      refLow: GLUCOSE_REF_LOW,
      refHigh: GLUCOSE_REF_HIGH,
    }
  );
}

async function gotoLabs(page: Page) {
  await page.goto("/health/labs");
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );
  await seedHistory(page);
  await page.goto("/health/labs");
  await expect(page.getByTestId("health-labs")).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Lab analytics DoD journey (F5.2 cohesion)", () => {
  test("should walk introduce → evolution → review → out-of-range → dashboard in one session", async ({
    page,
  }) => {
    // Arrange
    await gotoLabs(page);

    // Act — DoD-1: introduce a new analysis by form (a third glucose point).
    const header = page.getByTestId("lab-report-header");
    await header.getByLabel("Date").fill(NEW_DATE);
    await header.getByLabel("Lab").fill("New Lab");
    const row = page.getByTestId("lab-parameter-row").first();
    await row
      .getByLabel("Parameter", { exact: true })
      .fill("Glucose (fasting) (GLU)");
    await row.getByLabel("Value").fill("90");
    await page.getByRole("button", { name: "Save" }).click();

    // Assert — DoD-1: the new report persisted.
    await expect(page.getByText("Lab report saved")).toBeVisible();

    // Assert — DoD-4: ferritin (recorded only in the old report) is still
    // surfaced and flagged out-of-range in the latest-values list.
    await expect(
      page.locator(
        '[data-testid="lab-parameter-item"][data-parameter-key="ferritin"][data-flag="high"]'
      )
    ).toBeVisible();

    // Act — DoD-2: open glucose's evolution chart.
    await page
      .locator(
        '[data-parameter-key="glucose"] [data-testid="lab-parameter-select"]'
      )
      .click();

    // Assert — DoD-2: three points (2 seeded + 1 new) with a reference band.
    const chart = page.getByTestId("lab-parameter-chart");
    await expect(chart).toHaveAttribute("data-has-band", "true");
    await expect(chart).toHaveAttribute(
      "data-point-count",
      String(EXPECTED_GLUCOSE_POINTS)
    );

    // Act — DoD-3: review the old report.
    await page.getByText(OLD_DATE).click();

    // Assert — DoD-3: the old report's parameters are shown with origin/flag.
    const review = page.getByTestId("lab-report-review");
    await expect(review).toHaveAttribute("data-report-id", "r-old");
    await expect(review.getByTestId("lab-review-value")).toHaveCount(2);

    // Act — F5: switch to the dashboard and pin both parameters.
    await page.getByTestId("lab-tab-dashboard").click();
    await expect(page.getByTestId("lab-dashboard")).toBeVisible();
    await page
      .locator(
        '[data-parameter-key="glucose"] [data-testid="lab-parameter-select"]'
      )
      .click();
    await page
      .locator(
        '[data-parameter-key="ferritin"] [data-testid="lab-parameter-select"]'
      )
      .click();

    // Assert — F5: both evolution charts render together.
    await expect(
      page
        .getByTestId("lab-dashboard-grid")
        .getByTestId("lab-parameter-chart-card")
    ).toHaveCount(2);
  });
});
