/**
 * Visual regression specs for the CoachingSidebar component.
 *
 * Covers desktop (1024×768) and mobile (768×1024) viewports for a
 * matched coaching workout. Baselines are generated via the
 * `update-visual-baselines` workflow (ubuntu-latest/chromium).
 *
 * Closes #554.
 */

import { expect, test } from "@playwright/test";

import { clearDexie, getWeekDates } from "./helpers/seed-dexie";
import { seedMatchedCoachingWorkout } from "./helpers/seed-matched-coaching-workout";
import { disableOnboardingTutorial } from "./test-setup";

const PROFILE_ID = "visual-sidebar-profile";
const SOURCE = "train2go";
const SOURCE_ID = "visual-sidebar-activity";
const WORKOUT_ID = "visual-sidebar-workout";

test.describe("CoachingSidebar visual regression", () => {
  // Baselines are generated on ubuntu-latest/chromium only (see
  // `update-visual-baselines.yml`). Snapshots are not maintained for the
  // other Playwright projects, so let them skip rather than fail with a
  // missing-baseline error on every push to main.
  test.skip(
    (_fixtures, testInfo) => testInfo.project.name !== "chromium",
    "Visual baselines are generated only for the chromium project."
  );

  test.beforeEach(async ({ page }) => {
    await disableOnboardingTutorial(page);
  });

  test("should match desktop screenshot at 1024px viewport for matched coaching workout", async ({
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedMatchedCoachingWorkout(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: SOURCE_ID,
      workoutId: WORKOUT_ID,
      day,
      ts,
    });

    // Act
    await page.goto(`/workout/${WORKOUT_ID}`);
    await expect(page.getByTestId("coaching-sidebar")).toBeVisible({
      timeout: 10_000,
    });

    // Assert
    await expect(page).toHaveScreenshot("coaching-sidebar-desktop.png");
  });

  test("should match mobile screenshot at 768px viewport for matched coaching workout", async ({
    page,
  }) => {
    // Arrange
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedMatchedCoachingWorkout(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: SOURCE_ID,
      workoutId: WORKOUT_ID,
      day,
      ts,
    });

    // Act
    await page.goto(`/workout/${WORKOUT_ID}`);
    await expect(page.getByTestId("coaching-sidebar")).toBeVisible({
      timeout: 10_000,
    });

    // Assert
    await expect(page).toHaveScreenshot("coaching-sidebar-mobile.png");
  });
});
