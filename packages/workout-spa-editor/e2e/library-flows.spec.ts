/**
 * Library Flows E2E
 *
 * Exercises the post-impl behaviour of the SPA surface-classification
 * rule for the Library:
 *   A) Header click → /library page (no modal); h1 receives focus.
 *   B) Calendar empty-day → in-flow picker (no navigation); date in
 *      accessible name; selection schedules and closes both dialogs.
 *   B-back) Browser back closes the picker without losing the
 *      parent route.
 *   C) Header click while editor has an active workout → page renders
 *      the "Load into editor" CTA; clicking it loads the template.
 *   D) Mobile viewport — header tap navigates (no modal mounts).
 */

import { expect, test } from "./fixtures/base";
import { openHeaderAction } from "./helpers/mobile-menu";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeTemplate,
  makeWorkout,
  seedTemplates,
  seedWorkouts,
} from "./helpers/seed-dexie";

test.describe("Library flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
  });

  test("Test A: header Library navigates to /library and focuses the page heading", async ({
    page,
  }) => {
    await page.goto("/calendar");

    await page.getByRole("button", { name: /open workout library/i }).click();
    await page.waitForURL(/\/library$/);

    await expect(page.getByTestId("library-page")).toBeVisible();
    // Heading is focused (data-route-heading) and is an h1.
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedTag).toBe("H1");
    const focusedHasAttr = await page.evaluate(
      () => document.activeElement?.hasAttribute("data-route-heading") ?? false
    );
    expect(focusedHasAttr).toBe(true);
    // No dialog should have mounted as a side-effect of the click.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Browser back returns to calendar.
    await page.goBack();
    await page.waitForURL(/\/calendar/);
    await expect(page.getByTestId("calendar-page")).toBeVisible();
  });

  test("Test B: empty-day picker opens with the date in its accessible name and schedules", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const targetDate = dates[1]; // Tuesday — guaranteed empty
    const weekId = getWeekId(targetDate);

    await seedTemplates(page, [makeTemplate({ name: "Tempo Ride" })]);
    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    const cell = page.getByTestId(`empty-day-${targetDate}`);
    await cell.scrollIntoViewIfNeeded();
    await cell.click({ force: true });
    await expect(page.getByTestId("empty-day-dialog")).toBeVisible();

    await page.getByRole("button", { name: /Add from Library/i }).click();

    const picker = page.getByTestId("template-picker-dialog");
    await expect(picker).toBeVisible();

    // The picker's accessible name MUST include the date.
    const expectedDate = new Date(targetDate + "T12:00:00Z").toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric" }
    );
    const dateRegex = new RegExp(expectedDate, "i");
    await expect(page.getByRole("dialog", { name: dateRegex })).toBeVisible();

    // URL has not navigated away.
    expect(page.url()).toMatch(new RegExp(`/calendar/${weekId}$`));

    await page.getByText("Tempo Ride").click();

    await expect(picker).not.toBeVisible();
    await expect(page.getByTestId("empty-day-dialog")).not.toBeVisible();
    expect(page.url()).toMatch(new RegExp(`/calendar/${weekId}$`));

    // Workout was scheduled — calendar shows a card on the target date.
    await page.waitForSelector('[data-testid^="workout-card-"]');
    const targetCol = page.getByTestId(`day-column-${targetDate}`);
    await expect(
      targetCol.locator('[data-testid^="workout-card-"]')
    ).toHaveCount(1);
  });

  test("Test B-back: browser back closes the picker without losing the parent route", async ({
    page,
  }) => {
    const dates = getWeekDates();
    const targetDate = dates[1];
    const weekId = getWeekId(targetDate);

    await seedTemplates(page, [makeTemplate({ name: "Tempo Ride" })]);
    await seedWorkouts(page, [
      makeWorkout({ date: dates[0], state: "structured" }),
    ]);
    await page.goto(`/calendar/${weekId}`);

    const cell = page.getByTestId(`empty-day-${targetDate}`);
    await cell.scrollIntoViewIfNeeded();
    await cell.click({ force: true });
    await page.getByRole("button", { name: /Add from Library/i }).click();
    await expect(page.getByTestId("template-picker-dialog")).toBeVisible();

    await page.goBack();

    await expect(page.getByTestId("template-picker-dialog")).not.toBeVisible();
    expect(page.url()).toMatch(new RegExp(`/calendar/${weekId}$`));
  });

  test("Test C: 'Load into editor' CTA appears with active workout and loads the template", async ({
    page,
  }) => {
    // Stage an active workout via the editor — open /workout/new with
    // a query date so the editor mounts; add a step so the workout
    // becomes non-null in the store.
    await page.goto("/workout/new");
    await page.getByTestId("add-step-button").click();

    // Seed a library template AFTER the dexie singleton is ready.
    await seedTemplates(page, [makeTemplate({ name: "Tempo Ride" })]);

    await page.goto("/library");
    await expect(page.getByTestId("library-page")).toBeVisible();

    // CTA is visible only when hasCurrentWorkout is true.
    const cta = page.getByTestId("card-load-into-editor");
    await expect(cta).toBeVisible();
    await cta.click();

    // After loading, the editor shows the loaded template — navigate
    // back to /workout/new and assert the active step count reflects
    // the template (steps from add-step + load).
    // The template's `Tempo Ride` is empty-step, so active editor
    // should now reflect the loaded KRD; assert we can navigate back
    // to the editor and see the loaded title in the workout section.
    await page.goto("/workout/new");
    // The title input or banner should contain the loaded template
    // name, OR the editor page should mount a workout section. We
    // assert the workout-section exists since the loaded KRD has the
    // name "Tempo Ride".
    await expect(page.getByText(/Tempo Ride/i).first()).toBeVisible();
  });

  test("Test D: mobile viewport — header Library tap navigates (no modal)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calendar");

    await openHeaderAction(page, /open workout library/i);
    await page.waitForURL(/\/library$/);

    await expect(page.getByTestId("library-page")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
