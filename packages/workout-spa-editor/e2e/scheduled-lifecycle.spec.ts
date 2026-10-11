/**
 * E2E: the lifecycle of a scheduled workout, on the real path.
 *
 * Nothing is seeded: the app's first-run default profile owns a workout
 * scheduled through the editor. From its calendar card the athlete opens the
 * detail, edits and saves, moves it with the keyboard, deletes it and undoes
 * the delete — each step checked after a reload, against what IndexedDB
 * kept rather than what the page still shows.
 */

import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { toLocalDateString } from "./helpers/local-date";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const NAME = "E2E lifecycle";
const UNKNOWN_ID = "00000000-0000-4000-8000-00000000dead";
/** More than a dialog's stops: date segments, Close, Cancel, the action. */
const MAX_PRESSES = 12;
const WARMUP_ID = "00000000-0000-4000-8000-00000000beef";

/** Another day of the same week, so the calendar shows both columns. */
const otherDayOfWeek = (today: Date): string => {
  const other = new Date(today);
  other.setDate(today.getDate() + (today.getDay() === 1 ? 1 : -1));
  return toLocalDateString(other);
};

const cardIn = (page: Page, date: string) =>
  page
    .getByTestId(`day-column-${date}`)
    .locator('[data-testid^="workout-card-"]');

async function scheduleToday(page: Page, today: string): Promise<string> {
  await page.goto(`/workout/new?source=scratch&date=${today}`);
  await page.getByTestId("edit-metadata-button").click();
  await page.getByTestId("workout-name-input").fill(NAME);
  await page.getByTestId("save-metadata-button").click();
  await page.getByTestId("add-first-step-button").click();
  await page.getByTestId("scratch-schedule-button").click();
  const card = cardIn(page, today);
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(NAME);
  return (await card.getAttribute("data-testid"))!.replace("workout-card-", "");
}

/** Presses `key` until `target` holds the focus; a date input's segments
    take several Tabs, so the count is not fixed. */
async function pressUntilFocused(page: Page, key: string, target: Locator) {
  for (let press = 0; press < MAX_PRESSES; press++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  await expect(target).toBeFocused();
}

async function openMenuItemByKeyboard(page: Page, item: RegExp) {
  await page.getByRole("button", { name: "More options" }).focus();
  await page.keyboard.press("Enter");
  const menuItem = page.getByRole("menuitem", { name: item });
  await expect(menuItem).toBeVisible();
  await pressUntilFocused(page, "ArrowDown", menuItem);
  await page.keyboard.press("Enter");
}

/** Card → detail → Delete → confirm; the app returns to the calendar. */
async function deleteFromDetail(page: Page, card: Locator) {
  await card.click();
  await expect(page).toHaveURL(/\/workout\/view\//);
  await openMenuItemByKeyboard(page, /^Delete workout$/);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page).toHaveURL(/\/calendar/);
}

test.describe("Scheduled workout lifecycle", () => {
  test("should edit, move, delete and restore a scheduled workout", async ({
    page,
  }) => {
    // Arrange
    const now = new Date();
    const today = toLocalDateString(now);
    const moved = otherDayOfWeek(now);
    await page.goto("/calendar");
    await waitForDexieReady(page);
    const id = await scheduleToday(page, today);

    // Act + Assert: the card opens the detail, the edit survives a reload.
    await cardIn(page, today).click();
    await expect(page).toHaveURL(new RegExp(`/workout/view/${id}`));
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.locator('[data-testid="step-card"]')).toHaveCount(1);
    await page.getByTestId("add-step-button").click();
    await expect(page.getByTestId("editor-unsaved")).toBeVisible();
    await page.getByTestId("editor-save-button").click();
    await expect(page.getByTestId("editor-unsaved")).toHaveCount(0);
    await page.reload();
    await expect(page.locator('[data-testid="step-card"]')).toHaveCount(2);

    // Act + Assert: "Move to another day", keyboard only.
    await page.goto(`/workout/view/${id}`);
    await openMenuItemByKeyboard(page, /^Move to another day$/);
    await page.getByTestId("schedule-date-input").fill(moved);
    await pressUntilFocused(
      page,
      "Tab",
      page.getByRole("button", { name: "Move" })
    );
    await page.keyboard.press("Enter");
    await expect(
      page.getByText("Workout moved", { exact: true })
    ).toBeVisible();
    await page.goto("/calendar");
    await expect(cardIn(page, moved)).toHaveCount(1);
    await expect(cardIn(page, today)).toHaveCount(0);

    // Act + Assert: delete, then Undo brings the card back.
    await deleteFromDetail(page, cardIn(page, moved));
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(cardIn(page, moved)).toHaveCount(1);
    await page.reload();
    await expect(cardIn(page, moved)).toHaveCount(1);

    // Act + Assert: a delete with no Undo holds after a reload.
    await deleteFromDetail(page, cardIn(page, moved));
    await page.reload();
    await expect(page.getByTestId(`workout-card-${id}`)).toHaveCount(0);
  });

  for (const route of ["/workout/", "/workout/view/"]) {
    test(`should say "not found" for an unknown id at ${route}`, async ({
      page,
    }) => {
      // Arrange: load the route's code once, so the 2 s below measures the
      // record lookup and not a cold dev-server compile of the page chunk.
      await page.goto(`${route}${WARMUP_ID}`);
      await expect(page.getByText("Workout not found")).toBeVisible();
      await page.getByRole("button", { name: "Go to calendar" }).click();
      await expect(page.getByText("Workout not found")).toHaveCount(0);

      // Act
      await page.evaluate((hash) => {
        window.location.hash = hash;
      }, `#${route}${UNKNOWN_ID}`);

      // Assert
      await expect(page.getByText("Workout not found")).toBeVisible({
        timeout: 2000,
      });
    });
  }
});
