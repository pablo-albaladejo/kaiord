/**
 * E2E: the workout detail page lays out for the screen it is on.
 *
 * Measured in Spanish, whose nav labels are the longest the header carries:
 * the sheet was a phone-width column on every screen, its action buttons
 * stretched to the height of the send hint beside them, the actions sat a
 * viewport below the fold, and the header wrapped the avatar onto a row of
 * its own between `lg` and the width the labels need.
 */

import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { workoutCardsOn } from "./helpers/calendar-day";
import { toLocalDateString } from "./helpers/local-date";

test.use({ locale: "es-ES", colorScheme: "dark" });

/** A sheet narrower than this reads as a phone column on a desktop. */
const MIN_DESKTOP_SHEET_WIDTH = 640;
/** One line of button text: the 44px touch target plus its border. */
const MAX_ACTION_HEIGHT = 48;
const SAME_ROW_TOLERANCE = 4;

async function openScheduledDetail(page: Page): Promise<void> {
  const today = toLocalDateString(new Date());
  await page.goto(`/workout/new?source=scratch&date=${today}`);
  await page.getByTestId("edit-metadata-button").click();
  await page.getByTestId("workout-name-input").fill("Diseño");
  await page.getByTestId("save-metadata-button").click();
  await page.getByTestId("add-first-step-button").click();
  await page.getByTestId("scratch-schedule-button").click();
  const card = workoutCardsOn(page, today);
  await expect(card).toHaveCount(1);
  await card.click();
  await expect(page).toHaveURL(/\/workout\/view\//);
  await expect(page.getByTestId("workout-detail")).toBeVisible();
}

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  expect(rect).not.toBeNull();
  return rect!;
};

const centerY = (rect: { y: number; height: number }) =>
  rect.y + rect.height / 2;

/** Below xl (the header stacks), at xl, and the reporter's wide screen. */
const DESKTOP_VIEWPORTS = [
  { width: 1100, height: 800 },
  { width: 1280, height: 800 },
  { width: 2000, height: 1070 },
] as const;

for (const { width, height } of DESKTOP_VIEWPORTS) {
  test.describe(`Workout detail at ${width}px`, () => {
    test.skip(({ isMobile }) => isMobile, "Desktop widths only.");

    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openScheduledDetail(page);
    });

    test("should keep the avatar on the nav row", async ({ page }) => {
      const calendar = await box(
        page.getByTestId("status-header-calendar-button")
      );
      const avatar = await box(
        page.getByTestId("status-header-account-button")
      );

      expect(Math.abs(centerY(avatar) - centerY(calendar))).toBeLessThanOrEqual(
        SAME_ROW_TOLERANCE
      );
    });

    test("should give the sheet a desktop width", async ({ page }) => {
      const sheet = await box(page.getByTestId("workout-detail"));

      expect(sheet.width).toBeGreaterThanOrEqual(MIN_DESKTOP_SHEET_WIDTH);
    });

    test("should show one-line actions without scrolling", async ({ page }) => {
      const edit = await box(page.getByRole("button", { name: "Editar" }));
      const viewport = page.viewportSize()!;

      expect(edit.height).toBeLessThanOrEqual(MAX_ACTION_HEIGHT);
      expect(edit.y + edit.height).toBeLessThanOrEqual(viewport.height);
    });
  });
}

test.describe("Workout detail on a phone", () => {
  test.skip(({ isMobile }) => !isMobile, "Phone projects only.");

  test("should keep every action one line tall", async ({ page }) => {
    await openScheduledDetail(page);
    const footer = page.getByTestId("workout-detail-footer");
    await footer.scrollIntoViewIfNeeded();

    for (const name of ["Editar", "Ajustar con IA", "Enviar a Garmin"]) {
      const action = await box(footer.getByRole("button", { name }));
      expect(action.height, name).toBeLessThanOrEqual(MAX_ACTION_HEIGHT);
    }
  });
});
