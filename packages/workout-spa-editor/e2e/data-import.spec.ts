/**
 * E2E: "Import backup" restores a file written by "Export my data".
 *
 * Nothing is seeded: every record is entered through the UI of a clean
 * browser, exported, and imported through Settings → Privacy, into a second
 * clean browser (its own first-run default profile) or back into the same
 * one. What the import kept is read from IndexedDB, after the summary the
 * page shows once the import has written.
 */

import type { Browser, Page } from "@playwright/test";

import { mockLlmSuccess } from "./fixtures/api-mocks";
import { appUrl, expect, test } from "./fixtures/base";
import { calendarDay, workoutCardsOn } from "./helpers/calendar-day";
import { toLocalDateString } from "./helpers/local-date";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

type Row = Record<string, unknown>;

const KCAL_A = 437;
const KCAL_B = 222;
const SUMMARY = /^Backup imported: /;

const readTable = (page: Page, table: string): Promise<Row[]> =>
  page.evaluate(async (name) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<unknown[]> };
    };
    return (await db.table(name).toArray()) as Row[];
  }, table);

/** A clean browser of its own, opened at the calendar. */
async function cleanBrowser(browser: Browser, baseURL: string): Promise<Page> {
  const context = await browser.newContext({ baseURL, locale: "en-US" });
  const page = await context.newPage();
  await page.goto(appUrl("/calendar"));
  await waitForDexieReady(page);
  return page;
}

/** `goto` that always loads the route from scratch (see fixtures/base). */
async function open(page: Page, route: string) {
  await page.goto("about:blank");
  await page.goto(appUrl(route));
}

async function scheduleToday(page: Page, today: string): Promise<string> {
  await open(page, `/workout/new?source=scratch&date=${today}`);
  await page.getByTestId("scratch-schedule-button").click();
  const card = workoutCardsOn(page, today);
  await expect(card).toHaveCount(1);
  return (await card.getAttribute("data-testid"))!.replace("workout-card-", "");
}

async function logIntake(page: Page, kcal: number) {
  await open(page, "/nutrition");
  const logger = page.getByTestId("intake-logger");
  await logger.getByLabel("Energy (kcal)").fill(String(kcal));
  await logger.getByTestId("intake-log-submit").click();
  await expect(page.getByText("Entry logged", { exact: true })).toBeVisible();
}

async function saveWellness(page: Page, today: string) {
  await open(page, "/calendar");
  await calendarDay(page, today).add.click();
  await page.getByTestId("add-entry-choose-wellness").click();
  const dialog = page.getByTestId("wellness-entry-dialog");
  await dialog.getByLabel("Weight (kg)").fill("70.4");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Wellness saved", { exact: true })).toBeVisible();
}

async function addProvider(page: Page) {
  // Adding a provider checks its key against the provider; answer locally.
  await mockLlmSuccess(page);
  await open(page, "/settings/ai");
  await page.getByLabel("Label").fill("E2E provider");
  await page.getByLabel("API Key").fill("sk-e2e-fake-import-key");
  await page.getByRole("button", { name: "Add Provider" }).click();
  await expect(page.getByText("E2E provider").first()).toBeVisible();
}

async function exportData(page: Page): Promise<string> {
  await open(page, "/settings/privacy");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export my data" }).click(),
  ]);
  return (await download.path())!;
}

async function importData(page: Page, file: string): Promise<string> {
  await open(page, "/settings/privacy");
  await page.getByLabel("Backup file").setInputFiles(file);
  const status = page.getByRole("status").filter({ hasText: SUMMARY });
  await expect(status).toBeVisible();
  return status.innerText();
}

async function deleteWorkout(page: Page, id: string) {
  await open(page, `/workout/view/${id}`);
  await page.getByRole("button", { name: "More options" }).click();
  await page.getByRole("menuitem", { name: /^Delete workout$/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page).toHaveURL(/\/calendar/);
  await expect
    .poll(async () => (await readTable(page, "tombstones")).map((t) => t.id))
    .toContain(id);
}

async function deleteIntake(page: Page) {
  await open(page, "/nutrition");
  const row = page.getByTestId("intake-entry-row");
  await row.getByRole("button", { name: "Delete entry" }).click();
  await expect(row).toHaveCount(0);
  await expect
    .poll(async () => (await readTable(page, "tombstones")).map((t) => t.table))
    .toContain("intakeEntries");
}

test.describe("Import backup", () => {
  test("should restore a backup from one clean browser into another", async ({
    page,
    browser,
    baseURL,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await saveWellness(page, today);
    const workoutId = await scheduleToday(page, today);
    await logIntake(page, KCAL_A);
    await addProvider(page);
    const file = await exportData(page);
    const [profile] = await readTable(page, "profiles");
    const other = await cleanBrowser(browser, baseURL!);

    // Act
    await importData(other, file);

    // Assert
    expect(await readTable(other, "profiles")).toEqual([
      expect.objectContaining({ id: profile.id, origin: "local" }),
    ]);
    expect(await readTable(other, "healthWeight")).toHaveLength(1);
    expect(await readTable(other, "intakeEntries")).toEqual([
      expect.objectContaining({ kcal: KCAL_A, profileId: profile.id }),
    ]);
    await open(other, "/calendar");
    await expect(other.getByTestId(`workout-card-${workoutId}`)).toBeVisible();
    await open(other, "/settings/ai");
    await expect(other.getByText("Missing key")).toBeVisible();
    await other.context().close();
  });

  test("should merge a backup into a browser that has its own records", async ({
    page,
    browser,
    baseURL,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await page.goto("/calendar");
    await waitForDexieReady(page);
    const theirs = await scheduleToday(page, today);
    await logIntake(page, KCAL_A);
    const file = await exportData(page);
    const other = await cleanBrowser(browser, baseURL!);
    const mine = await scheduleToday(other, today);
    await logIntake(other, KCAL_B);

    // Act
    await importData(other, file);

    // Assert
    expect(await readTable(other, "profiles")).toHaveLength(1);
    const ids = (await readTable(other, "workouts")).map((w) => w.id);
    expect(ids).toEqual(expect.arrayContaining([theirs, mine]));
    const kcal = (await readTable(other, "intakeEntries")).map((e) => e.kcal);
    expect(kcal).toHaveLength(2);
    expect(kcal).toEqual(expect.arrayContaining([KCAL_A, KCAL_B]));
    await other.context().close();
  });

  test("should keep a workout deleted after the backup deleted", async ({
    page,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await page.goto("/calendar");
    await waitForDexieReady(page);
    const id = await scheduleToday(page, today);
    const file = await exportData(page);
    await deleteWorkout(page, id);

    // Act
    const summary = await importData(page, file);

    // Assert
    expect(summary).toContain("1 deleted after the backup (not restored)");
    expect((await readTable(page, "workouts")).map((w) => w.id)).not.toContain(
      id
    );
    await open(page, "/calendar");
    await expect(page.getByTestId(`workout-card-${id}`)).toHaveCount(0);
  });

  test("should keep an intake deleted after the backup deleted", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/calendar");
    await waitForDexieReady(page);
    await logIntake(page, KCAL_A);
    const file = await exportData(page);
    await deleteIntake(page);

    // Act
    const summary = await importData(page, file);

    // Assert
    expect(summary).toContain("1 deleted after the backup (not restored)");
    expect(await readTable(page, "intakeEntries")).toEqual([]);
    await open(page, "/nutrition");
    await expect(page.getByTestId("intake-entry-row")).toHaveCount(0);
  });
});
