/**
 * E2E: the "New session" sheet keeps the context it was opened with.
 *
 * Opened from a calendar day, every way out of the sheet — Blank, Import
 * file, Template — lands the session on THAT day, and Blank keeps the sport
 * picked on the sheet. Closing a dated sheet returns to its week instead of
 * reopening the sheet. Each test drives the real path: the day's "+" in the
 * week grid, the Workout | Wellness chooser, then the sheet.
 */

import { readFileSync } from "node:fs";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { toLocalDateString } from "./helpers/local-date";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeTemplate,
  seedDefaultProfile,
  seedTemplates,
} from "./helpers/seed-dexie";

const ACTIVITY_FIT = new URL(
  "../../../test-fixtures/fit/Activity.fit",
  import.meta.url
);

// A day of the current week that is not today, so "lands on today" — the
// bug — cannot pass for "lands on the chosen day".
const chosenDay = (): string => {
  const today = toLocalDateString(new Date());
  return getWeekDates().find((d) => d !== today) ?? getWeekDates()[0];
};

async function openSheetFor(page: Page, day: string): Promise<void> {
  await page.goto(`/calendar/${getWeekId(day)}`);
  const plus = page.getByTestId(`empty-day-${day}`);
  await plus.scrollIntoViewIfNeeded();
  await plus.click({ force: true });
  await page.getByTestId("add-entry-choose-workout").click();
  await expect(page.getByTestId("create-workout")).toBeVisible();
}

const readTable = (page: Page, table: string) =>
  page.evaluate(async (name) => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<unknown[]> };
    };
    return (await db.table(name).toArray()) as Array<Record<string, unknown>>;
  }, table);

const cardsOn = (page: Page, day: string) =>
  page
    .getByTestId(`day-column-${day}`)
    .locator('[data-testid^="workout-card-"]');

test.describe("New session keeps its context", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
  });

  test("should schedule a Blank session on the chosen day with the chosen sport", async ({
    page,
  }) => {
    // Arrange
    const day = chosenDay();
    await openSheetFor(page, day);
    await page.getByRole("radio", { name: "Running" }).click();

    // Act
    await page.getByRole("button", { name: "Blank" }).click();
    await page.getByTestId("edit-metadata-button").click();
    await expect(page.getByTestId("workout-sport-select")).toHaveValue(
      "running"
    );
    await page.getByTestId("workout-name-input").fill("Monday intervals");
    await page.getByTestId("save-metadata-button").click();
    await page.getByTestId("scratch-schedule-button").click();

    // Assert
    await expect(page).toHaveURL(new RegExp(`/calendar/${getWeekId(day)}$`));
    await expect(cardsOn(page, day)).toHaveCount(1);
    const [stored] = await readTable(page, "workouts");
    expect(stored).toMatchObject({ date: day, sport: "running" });
  });

  test("should import an activity onto the chosen day", async ({ page }) => {
    // Arrange
    const day = chosenDay();
    await openSheetFor(page, day);
    await page.getByRole("button", { name: "Import file" }).click();
    const overlay = page.getByTestId("import-dropzone-overlay");

    // Act
    await overlay.locator('input[type="file"]').setInputFiles({
      name: "Activity.fit",
      mimeType: "application/octet-stream",
      buffer: readFileSync(ACTIVITY_FIT),
    });

    // Assert
    await expect(page).toHaveURL(new RegExp(`/calendar/${getWeekId(day)}$`));
    await expect
      .poll(async () =>
        (await readTable(page, "activities")).map((a) => a.date)
      )
      .toEqual([day]);
  });

  test("should pick a Template and schedule it on the chosen day", async ({
    page,
  }) => {
    // Arrange
    const day = chosenDay();
    await seedTemplates(page, [makeTemplate({ name: "Tempo Run" })]);
    await openSheetFor(page, day);

    // Act
    await page.getByRole("button", { name: "Template" }).click();
    await expect(page.getByTestId("library-picker-hint")).toBeVisible();
    await page
      .getByRole("button", { name: /^Schedule$/ })
      .first()
      .click();

    // Assert
    await expect(page).toHaveURL(new RegExp(`/calendar/${getWeekId(day)}$`));
    await expect(cardsOn(page, day)).toHaveCount(1);
  });

  test("should close a dated sheet to its week", async ({ page }) => {
    // Arrange
    const day = chosenDay();
    await openSheetFor(page, day);

    // Act
    await page
      .getByTestId("create-workout")
      .getByRole("button", { name: "Close" })
      .click();

    // Assert
    await expect(page).toHaveURL(new RegExp(`/calendar/${getWeekId(day)}$`));
    await expect(page.getByTestId("create-workout")).toHaveCount(0);
  });

  test("should propose today when scheduling from the library and explain an empty date", async ({
    page,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await seedTemplates(page, [makeTemplate({ name: "Recovery Spin" })]);
    await page.goto("/library");
    await page
      .getByRole("button", { name: /^Schedule$/ })
      .first()
      .click();
    const input = page.getByTestId("schedule-date-input");
    const dialog = page.getByRole("dialog");

    // Act
    await expect(input).toHaveValue(today);
    await input.fill("");
    await dialog.getByRole("button", { name: "Schedule" }).click();

    // Assert
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    expect(await readTable(page, "workouts")).toHaveLength(0);
  });

  test("should propose the workout's name when keeping it in the library", async ({
    page,
  }) => {
    // Arrange
    await openSheetFor(page, chosenDay());
    await page.getByRole("button", { name: "Blank" }).click();
    await page.getByTestId("edit-metadata-button").click();
    await page.getByTestId("workout-name-input").fill("Tempo Tuesday");
    await page.getByTestId("save-metadata-button").click();

    // Act
    await page.getByRole("button", { name: "Keep in library" }).click();

    // Assert
    await expect(
      page.getByRole("dialog").getByLabel(/workout name/i)
    ).toHaveValue("Tempo Tuesday");
  });
});
