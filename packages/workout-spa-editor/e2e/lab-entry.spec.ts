/**
 * DoD-1 E2E: enter a lab report with ~10 mixed parameters (catalog + free +
 * a non-canonical unit + HbA1c mmol/mol + a pct/abs differential pair),
 * save, hard-reload the page, and verify the analysis persists with
 * canonical values, canonical ranges, and flags. F2 ships only the entry
 * form (no list/review UI yet — that's F3), so the persisted shape is
 * verified by reading the Dexie tables directly via `__KAIORD_DB__`,
 * mirroring the seeding pattern in `profiles.spec.ts`.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";

const PROFILE_ID = "labs-e2e-profile";
const PROFILE_NAME = "Labs E2E Athlete";
const REPORT_DATE = "2026-03-05";
const HBA1C_LOWER_BOUND = 6;
const HBA1C_UPPER_BOUND = 7;

async function seedProfile(page: Page) {
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
      for (const t of ["profiles", "meta", "labReports", "labValues"]) {
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
    },
    { profileId: PROFILE_ID, name: PROFILE_NAME }
  );
}

async function gotoLabEntry(page: Page) {
  await page.goto("/health/labs");
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );
  await seedProfile(page);
  await page.goto("/health/labs");
  await expect(page.getByTestId("health-labs")).toBeVisible({
    timeout: 10_000,
  });
}

type ParamRow = {
  mode?: "custom";
  label: string;
  value: string;
  unit?: string;
  refLow?: string;
  refHigh?: string;
};

const PARAMS: ParamRow[] = [
  { label: "Glucosa (ayunas) (GLU)", value: "90" },
  { label: "Hemoglobina glicada (HbA1c)", value: "48", unit: "mmol/mol" },
  { label: "Vitamina D (25-OH) (25-OH-D)", value: "60", unit: "nmol/L" },
  { label: "Neutrófilos % (NEU%)", value: "55" },
  { label: "Neutrófilos absolutos (NEU#)", value: "3.5" },
  {
    label: "Creatinina (CREA)",
    value: "1.2",
    refLow: "0.6",
    refHigh: "1.1",
  },
  { label: "TSH (TSH)", value: "2.1" },
  { label: "Sodio (Na)", value: "140" },
  { label: "Potasio (K)", value: "4.2" },
  { mode: "custom", label: "Apo-E Genotipo", value: "3.1", unit: "ratio" },
];

async function fillRow(page: Page, index: number, spec: ParamRow) {
  const row = page.getByTestId("lab-parameter-row").nth(index);
  if (spec.mode === "custom") {
    await row.getByRole("button", { name: "Custom" }).click();
    await row.getByLabel("Custom parameter name").fill(spec.label);
  } else {
    await row.getByLabel("Parameter", { exact: true }).fill(spec.label);
  }
  await row.getByLabel("Value").fill(spec.value);
  if (spec.unit) await row.getByLabel("Unit").fill(spec.unit);
  if (spec.refLow) await row.getByLabel("Reference low").fill(spec.refLow);
  if (spec.refHigh) await row.getByLabel("Reference high").fill(spec.refHigh);
}

test.describe("Lab analytics entry (DoD-1)", () => {
  test("should persist ~10 mixed parameters with canonical values and flags after reload", async ({
    page,
  }) => {
    // Arrange
    await gotoLabEntry(page);
    const header = page.getByTestId("lab-report-header");
    await header.getByLabel("Date").fill(REPORT_DATE);
    await header.getByLabel("Lab").fill("Quest Diagnostics");

    // Act — one row exists by default; add the rest, then fill every row.
    for (let i = 1; i < PARAMS.length; i++) {
      await page.getByRole("button", { name: "Add parameter" }).click();
    }
    for (let i = 0; i < PARAMS.length; i++) {
      await fillRow(page, i, PARAMS[i]);
    }
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Lab report saved")).toBeVisible();
    await page.reload();
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );

    // Assert — read the persisted rows straight from Dexie (no list UI yet).
    const { reports, values } = await page.evaluate(async (profileId) => {
      const db = (window as unknown as { __KAIORD_DB__?: unknown })
        .__KAIORD_DB__ as {
        table: (n: string) => {
          toArray: () => Promise<Record<string, unknown>[]>;
        };
      };
      const allReports = await db.table("labReports").toArray();
      const allValues = await db.table("labValues").toArray();
      return {
        reports: allReports.filter((r) => r.profileId === profileId),
        values: allValues.filter((v) => v.profileId === profileId),
      };
    }, PROFILE_ID);

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      date: REPORT_DATE,
      labName: "Quest Diagnostics",
    });
    expect(values).toHaveLength(PARAMS.length);

    const byKey = Object.fromEntries(values.map((v) => [v.parameterKey, v]));
    expect(byKey.glucose).toMatchObject({
      valueCanonical: 90,
      unitCanonical: "mg/dL",
      flag: "in",
    });
    expect(byKey.hba1c.unitCanonical).toBe("%");
    expect(byKey.hba1c.valueCanonical).toBeGreaterThan(HBA1C_LOWER_BOUND);
    expect(byKey.hba1c.valueCanonical).toBeLessThan(HBA1C_UPPER_BOUND);
    expect(byKey.vitamin_d).toMatchObject({
      valueCanonical: 24,
      unitCanonical: "ng/mL",
      flag: "low",
    });
    expect(byKey.neutrophils_pct).toBeDefined();
    expect(byKey.neutrophils_abs).toBeDefined();
    expect(byKey.creatinine).toMatchObject({
      refSource: "report",
      refLowCanonical: 0.6,
      refHighCanonical: 1.1,
      flag: "high",
    });
    expect(byKey["custom:apo-e-genotipo"]).toMatchObject({
      valueRaw: 3.1,
      valueCanonical: 3.1,
      unitRaw: "ratio",
      unitCanonical: "ratio",
    });
  });

  test("should be reachable from the health section's global nav", async ({
    page,
  }) => {
    // Arrange
    await gotoLabEntry(page);
    await page.goto("/calendar");

    // Act
    await page.getByTestId("status-header-labs-button").click();

    // Assert
    await expect(page).toHaveURL(/\/health\/labs$/);
    await expect(page.getByTestId("health-labs")).toBeVisible();
  });
});
