/**
 * E2E: "Export my data" downloads every record of a clean browser.
 *
 * Nothing is seeded. The app's own first-run default profile (unclaimed,
 * `origin: "auto"`) receives a wellness value, a scheduled workout, an intake
 * and an AI provider with a fake key, all entered through the UI. The
 * downloaded file must carry the records and none of the secrets, and the
 * local profile must stay unclaimed: only the file calls it a real one.
 */

import { readFile } from "node:fs/promises";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { toLocalDateString } from "./helpers/local-date";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const FAKE_KEY = "sk-e2e-fake-export-key";
const INTAKE_KCAL = 437;

type Row = Record<string, unknown>;

const readLocalProfiles = (page: Page): Promise<Row[]> =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<unknown[]> };
    };
    return (await db.table("profiles").toArray()) as Row[];
  });

async function enterRecords(page: Page, today: string): Promise<string> {
  await page.getByTestId(`empty-day-${today}`).click();
  await page.getByTestId("add-entry-choose-wellness").click();
  const dialog = page.getByTestId("wellness-entry-dialog");
  await dialog.getByLabel("Weight (kg)").fill("70.4");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Wellness saved", { exact: true })).toBeVisible();

  await page.goto(`/workout/new?source=scratch&date=${today}`);
  await page.getByTestId("scratch-schedule-button").click();
  const card = page
    .getByTestId(`day-column-${today}`)
    .locator('[data-testid^="workout-card-"]');
  await expect(card).toHaveCount(1);
  const workoutId = (await card.getAttribute("data-testid"))!.replace(
    "workout-card-",
    ""
  );

  await page.goto("/nutrition");
  const logger = page.getByTestId("intake-logger");
  await logger.getByLabel("Energy (kcal)").fill(String(INTAKE_KCAL));
  await logger.getByTestId("intake-log-submit").click();
  await expect(page.getByText("Entry logged", { exact: true })).toBeVisible();

  await page.goto("/settings/ai");
  await page.getByLabel("Label").fill("E2E provider");
  await page.getByLabel("API Key").fill(FAKE_KEY);
  await page.getByRole("button", { name: "Add Provider" }).click();
  await expect(page.getByText("E2E provider").first()).toBeVisible();
  return workoutId;
}

test.describe("Export my data", () => {
  test("should download the records of a clean browser without secrets", async ({
    page,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await page.goto("/calendar");
    await waitForDexieReady(page);
    const workoutId = await enterRecords(page, today);
    await page.goto("/settings/privacy");

    // Act
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export my data" }).click(),
    ]);
    const body = await readFile((await download.path())!, "utf8");

    // Assert
    expect(download.suggestedFilename()).toMatch(/^kaiord-backup-.*\.json$/);
    for (const needle of ["apiKey", FAKE_KEY, "syncState", '"origin":"auto"'])
      expect(body).not.toContain(needle);
    const backup = JSON.parse(body);
    expect(backup).toMatchObject({ format: "kaiord-backup", version: 1 });
    expect(backup.tables.workouts.map((w: Row) => w.id)).toContain(workoutId);
    expect(backup.tables.healthWeight).toHaveLength(1);
    expect(backup.tables.aiProviders).toEqual([
      expect.objectContaining({ label: "E2E provider" }),
    ]);
    expect(backup.nutrition.intakeEntries).toEqual([
      expect.objectContaining({ kcal: INTAKE_KCAL }),
    ]);
    expect(backup.tables.profiles).toEqual([
      expect.objectContaining({ origin: "local" }),
    ]);
    expect(await readLocalProfiles(page)).toEqual([
      expect.objectContaining({ origin: "auto" }),
    ]);
  });
});
