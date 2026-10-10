/**
 * E2E: a clean browser works without visiting the athlete page first.
 *
 * No profile is seeded. The app creates its first-run default profile
 * ("My profile", `origin: "auto"`) when the database opens, so scheduling,
 * wellness, nutrition and preferences all work from the first visit. None
 * of those actions edits the profile, so it stays unclaimed (and therefore
 * out of any Drive sync until a claim).
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { toLocalDateString } from "./helpers/local-date";
import { getWeekId } from "./helpers/seed-dexie";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

type StoredProfile = { id: string; name: string; origin?: string };

const readProfiles = (page: Page): Promise<StoredProfile[]> =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<unknown[]> };
    };
    return (await db.table("profiles").toArray()) as StoredProfile[];
  });

async function expectOneUnclaimedProfile(page: Page): Promise<void> {
  const profiles = await readProfiles(page);
  expect(profiles).toHaveLength(1);
  expect(profiles[0]).toMatchObject({ name: "My profile", origin: "auto" });
}

test.describe("Default local profile on a clean browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await waitForDexieReady(page);
  });

  test("should create one unclaimed profile and point to the athlete page once", async ({
    page,
  }) => {
    // Arrange
    const notice = page.getByTestId("default-profile-notice");

    // Act
    await expect(notice).toBeVisible();
    await notice.getByRole("button", { name: "Got it" }).click();
    await expect(notice).toHaveCount(0);
    await page.reload();

    // Assert
    await expect(page.getByTestId("calendar-view-toggle")).toBeVisible();
    await expect(notice).toHaveCount(0);
    await expectOneUnclaimedProfile(page);
  });

  test("should schedule a scratch workout from the editor without a profile visit", async ({
    page,
  }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await page.goto(`/workout/new?source=scratch&date=${today}`);
    const schedule = page.getByTestId("scratch-schedule-button");

    // Act
    await expect(schedule).toBeEnabled();
    await schedule.click();

    // Assert
    await expect(page).toHaveURL(new RegExp(`/calendar/${getWeekId(today)}$`));
    await expect(
      page
        .getByTestId(`day-column-${today}`)
        .locator('[data-testid^="workout-card-"]')
    ).toHaveCount(1);
    await expectOneUnclaimedProfile(page);
  });

  test("should save a wellness entry from the calendar", async ({ page }) => {
    // Arrange
    const today = toLocalDateString(new Date());
    await page.getByTestId(`empty-day-${today}`).click();
    await page.getByTestId("add-entry-choose-wellness").click();
    const dialog = page.getByTestId("wellness-entry-dialog");

    // Act
    await dialog.getByLabel("Weight (kg)").fill("70");
    await dialog.getByRole("button", { name: "Save" }).click();

    // Assert
    await expect(
      page.getByText("Wellness saved", { exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByTestId(`day-column-${today}`)
        .getByTestId("wellness-badge-weight")
    ).toBeVisible();
    await expectOneUnclaimedProfile(page);
  });

  test("should log a nutrition entry", async ({ page }) => {
    // Arrange
    await page.goto("/nutrition");
    const logger = page.getByTestId("intake-logger");

    // Act
    await logger.getByLabel("Energy (kcal)").fill("500");
    await logger.getByTestId("intake-log-submit").click();

    // Assert
    await expect(page.getByText("Entry logged", { exact: true })).toBeVisible();
    await page.reload();
    await expect(
      page.getByTestId("intake-entry-list").getByTestId("intake-entry-row")
    ).toHaveCount(1);
    await expectOneUnclaimedProfile(page);
  });

  test("should keep a preference across a reload", async ({ page }) => {
    // Arrange
    await page.goto("/settings/preferences");
    const units = page
      .getByTestId("settings-preferences")
      .getByRole("radiogroup", { name: "Units" });

    // Act
    await units.getByRole("radio", { name: "Imperial" }).click();
    await expect(
      units.getByRole("radio", { name: "Imperial" })
    ).toHaveAttribute("aria-checked", "true");
    await page.reload();

    // Assert
    await expect(
      page
        .getByTestId("settings-preferences")
        .getByRole("radiogroup", { name: "Units" })
        .getByRole("radio", { name: "Imperial" })
    ).toHaveAttribute("aria-checked", "true");
    await expectOneUnclaimedProfile(page);
  });
});
