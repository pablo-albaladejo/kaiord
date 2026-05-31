/**
 * Calendar Navigation E2E Tests
 *
 * Routing, URL-driven navigation, and SPA link behaviour.
 */

import { expect, test } from "./fixtures/base";

test.describe("Calendar Navigation", () => {
  test("/ redirects to /calendar", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/calendar/);
    expect(page.url()).toContain("/calendar");
  });

  test("/calendar shows the Today page", async ({ page }) => {
    // Post-redesign, bare /calendar renders the Today page; the week
    // calendar lives at /calendar/:weekId.
    await page.goto("/calendar");
    await expect(page.getByTestId("today-page")).toBeVisible();
  });

  test("/calendar/2026-W15 shows that week", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByTestId("week-navigation")).toBeVisible();
    await expect(
      page.getByTestId("week-navigation").getByText(/· W15/)
    ).toBeVisible();
  });

  test("/nonexistent redirects to /calendar", async ({ page }) => {
    await page.goto("/nonexistent");
    await page.waitForURL(/\/calendar/);
    expect(page.url()).toContain("/calendar");
  });

  test('Header "Calendar" button navigates to /calendar from /workout/new', async ({
    page,
  }) => {
    await page.goto("/workout/new?source=scratch");
    await page.getByRole("button", { name: "Go to calendar" }).click();
    await page.waitForURL(/\/calendar$/);
    // The header "Go to calendar" entry targets bare /calendar, which
    // renders the Today page post-redesign.
    await expect(page.getByTestId("today-page")).toBeVisible();
  });

  test("Kaiord logo navigates to /calendar (SPA, no reload)", async ({
    page,
  }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByTestId("calendar-page")).toBeVisible();

    // Set a JS variable to prove no full reload happens
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__SPA_NAV_CHECK__ = true;
    });

    await page.getByRole("link", { name: /Kaiord Editor/i }).click();
    // The logo links to /calendar (the Today page post-redesign).
    await page.waitForURL(/\/calendar$/);
    await expect(page.getByTestId("today-page")).toBeVisible();

    const survived = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__SPA_NAV_CHECK__
    );
    expect(survived).toBe(true);
  });

  test("Click prev week changes URL", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByText(/· W15/)).toBeVisible();

    await page.getByRole("button", { name: "Previous week" }).click();
    await page.waitForURL(/\/calendar\/2026-W14/);
    await expect(page.getByText(/· W14/)).toBeVisible();
  });

  test("Click next week changes URL", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByText(/· W15/)).toBeVisible();

    await page.getByRole("button", { name: "Next week" }).click();
    await page.waitForURL(/\/calendar\/2026-W16/);
    await expect(page.getByText(/· W16/)).toBeVisible();
  });

  test('Click "Today" navigates to the Today page', async ({ page }) => {
    await page.goto("/calendar/2026-W01");
    await expect(page.getByText(/· W01/)).toBeVisible();

    await page.getByRole("button", { name: "Today" }).click();

    // The week-nav "Today" button returns to bare /calendar, which
    // renders the Today page post-redesign.
    await page.waitForURL(/\/calendar$/);
    await expect(page.getByTestId("today-page")).toBeVisible();
  });

  test("Invalid week ID redirects to /calendar", async ({ page }) => {
    await page.goto("/calendar/bad-week");
    await page.waitForURL(/\/calendar$/);
    // CalendarPage redirects an unparseable week to bare /calendar,
    // which renders the Today page post-redesign.
    await expect(page.getByTestId("today-page")).toBeVisible();
  });
});
