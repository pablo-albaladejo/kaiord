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
import { loadTestWorkout } from "./helpers/load-test-workout";
import { openHeaderAction } from "./helpers/mobile-menu";
import {
  clearDexie,
  getWeekDates,
  getWeekId,
  makeTemplate,
  makeWorkout,
  seedDefaultProfile,
  seedTemplates,
  seedWorkouts,
} from "./helpers/seed-dexie";

test.describe("Library flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
  });

  test("Test A: header Library navigates to /library (no modal)", async ({
    page,
  }) => {
    await page.goto("/daily");

    // Use the mobile-aware helper so the test works on mobile
    // emulators where the Library button lives behind the hamburger menu.
    await openHeaderAction(page, /open workout library/i);
    await page.waitForURL(/\/library$/);

    await expect(page.getByTestId("library-page")).toBeVisible();
    // The routed page owns a single `[data-route-heading]` H1, which
    // receives focus on navigation via useFocusOnRouteChange.
    const heading = page.locator("h1[data-route-heading]");
    await expect(heading).toHaveText("Library");
    await expect(heading).toBeFocused();
    // No dialog should have mounted as a side-effect of the click.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Browser back returns to /daily (the Daily page).
    await page.goBack();
    await page.waitForURL(/\/daily$/);
    await expect(page.getByTestId("daily-page")).toBeVisible();
  });

  test("Test B: empty-day + opens the Create overlay whose Template tile routes to the Library", async ({
    page,
  }) => {
    // Post-redesign, the empty-day "+" routes to /workout/new?date=,
    // which renders the AI-first Create overlay. Its "Template" tile
    // navigates to the Library (the legacy inline TemplatePickerDialog
    // and one-click date scheduling were removed — see the e2e redesign
    // report flag on the lost "+"-to-date scheduling path).
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
    // The "+" opens the Workout | Wellness chooser; pick Workout.
    await page.getByTestId("add-entry-choose-workout").click();

    await page.waitForURL(new RegExp(`/workout/new\\?date=${targetDate}`));
    await expect(page.getByTestId("create-workout")).toBeVisible();

    await page.getByRole("button", { name: "Template" }).click();
    await page.waitForURL(/\/library$/);
    await expect(page.getByTestId("library-page")).toBeVisible();
    await expect(page.getByText("Tempo Ride", { exact: true })).toBeVisible();
  });

  test("Test B-back: browser back unmounts the Create overlay", async ({
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
    // The "+" opens the Workout | Wellness chooser; pick Workout.
    await page.getByTestId("add-entry-choose-workout").click();
    await page.waitForURL(new RegExp(`/workout/new\\?date=${targetDate}`));
    await expect(page.getByTestId("create-workout")).toBeVisible();

    await page.goBack();

    // The Create overlay is no longer mounted; we are back on the week.
    await expect(page.getByTestId("create-workout")).toHaveCount(0);
    await expect(page.getByTestId("calendar-page")).toBeVisible();
  });

  test("Test C: 'Load into editor' CTA appears with active workout and loads the template", async ({
    page,
  }) => {
    // Stage an active workout in the editor so `hasCurrentWorkout` is
    // true when we visit /library. `loadTestWorkout` performs a file-
    // upload through the WelcomeSection accordion which sets
    // `currentWorkout` in the Zustand store.
    await page.goto("/workout/new?source=scratch");
    await loadTestWorkout(page, "Initial Workout");

    // Seed a library template AFTER the dexie singleton is ready.
    await seedTemplates(page, [makeTemplate({ name: "Tempo Ride" })]);

    // Use SPA navigation (header button) so the in-memory editor
    // state survives the route transition. `page.goto('/library')`
    // would force a full reload and drop Zustand. The mobile-aware
    // helper opens the hamburger menu first on small viewports.
    await openHeaderAction(page, /open workout library/i);
    await page.waitForURL(/\/library$/);
    await expect(page.getByTestId("library-page")).toBeVisible();

    // CTA is visible only when hasCurrentWorkout is true.
    const cta = page.getByTestId("card-load-into-editor");
    await expect(cta).toBeVisible();
    await cta.click();

    // The CTA performs a SPA navigate to /workout/new after loading
    // the template into the workout store; the editor mounts with
    // the just-loaded KRD without a hard reload. The seeded template's
    // top-level `name` is "Tempo Ride", but its nested KRD's
    // `structured_workout.name` is "Template" (see `makeTemplate` in
    // helpers/dexie-factories.ts). The editor's WorkoutTitle reads
    // the KRD name, so that's what we assert visible. `source=scratch`
    // is the new explicit signal that bypasses NewWorkoutPicker and
    // mounts the editor with whatever the store currently holds.
    await page.waitForURL(/\/workout\/new\?source=scratch/);
    await expect(page.getByText(/Template/i).first()).toBeVisible();
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
