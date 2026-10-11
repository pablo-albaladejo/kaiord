/**
 * E2E: an empty library says how to fill it, and on a phone the paths that
 * work without an AI key sit above the bottom navigation instead of under
 * it, as does the end of any page once scrolled to it.
 *
 * Nothing is seeded: a first run, with the default profile's notice on
 * screen, as a new athlete sees it. The phone is 390×664 in Spanish — an
 * iPhone 13's viewport and the locale `verify:prod` checks — set here so the
 * default chromium project runs it on every PR.
 */

import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { toLocalDateString } from "./helpers/local-date";

const PHONE = { width: 390, height: 664 };
// Spanish: its longer copy wraps more, so it is the tighter fit.
const NON_AI = ["Plantilla", "En blanco", "Importar archivo"];

async function bottomOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("element has no layout box");
  return box.y + box.height;
}

async function navTop(page: Page): Promise<number> {
  const box = await page.getByTestId("bottom-nav").boundingBox();
  if (!box) throw new Error("bottom nav has no layout box");
  return box.y;
}

test.describe("Empty library", () => {
  test("should start a new session from the empty library", async ({
    page,
  }) => {
    await page.goto("/library");
    await expect(page.getByText("Your library is empty")).toBeVisible();

    await page.getByRole("button", { name: "New workout" }).click();

    await expect(page).toHaveURL(/#\/workout\/new$/);
    await expect(page.getByTestId("create-workout")).toBeVisible();
  });

  test("should open the file import from the empty library", async ({
    page,
  }) => {
    await page.goto("/library");

    await page.getByRole("button", { name: "Import file" }).click();

    await expect(page).toHaveURL(/#\/workout\/new\?action=import$/);
  });
});

test.describe("Phone layout above the bottom nav", () => {
  test.use({ viewport: PHONE, locale: "es-ES" });

  test("should show the non-AI starts above the nav without scrolling", async ({
    page,
  }) => {
    await page.goto("/workout/new");
    await expect(page.getByTestId("default-profile-notice")).toBeVisible();
    await expect(page.getByText(/configura un proveedor de ia/i)).toBeVisible();
    const limit = await navTop(page);

    for (const name of NON_AI) {
      const tile = page.getByRole("button", { name, exact: true });
      expect(await bottomOf(tile), name).toBeLessThanOrEqual(limit);
    }
  });

  test("should clear the nav at the end of a page taller than the screen", async ({
    page,
  }) => {
    const today = toLocalDateString(new Date());
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/workout/new?source=scratch&date=${today}`);
    await page.getByTestId("workout-name-input").fill("E2E footer");
    await page.getByTestId("save-metadata-button").click();
    await page.getByTestId("add-first-step-button").click();
    await page.getByTestId("scratch-schedule-button").click();
    const card = page
      .getByTestId(`day-column-${today}`)
      .locator('[data-testid^="workout-card-"]');
    await expect(card).toHaveCount(1);
    const id = (await card.getAttribute("data-testid"))!.replace(
      "workout-card-",
      ""
    );

    await page.setViewportSize(PHONE);
    await page.goto(`/workout/view/${id}`);
    const edit = page.getByRole("button", { name: "Editar", exact: true });
    await expect(edit).toBeVisible();

    // The detail's footer is the last thing on the page: scrolled to the
    // end, it must land above the floating nav, not behind it.
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" })
    );
    expect(await bottomOf(edit)).toBeLessThanOrEqual(await navTop(page));
  });
});
