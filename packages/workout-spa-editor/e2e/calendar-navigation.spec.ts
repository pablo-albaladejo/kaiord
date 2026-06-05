/**
 * Calendar Navigation E2E Tests
 *
 * Routing, URL-driven navigation, and SPA link behaviour.
 */

import { expect, test } from "./fixtures/base";

test.describe("Calendar Navigation", () => {
  test("/ redirects to /today", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/today/);
    expect(page.url()).toContain("/today");
  });

  test("/today shows the Today page", async ({ page }) => {
    await page.goto("/today");
    await expect(page.getByTestId("today-page")).toBeVisible();
  });

  test("/calendar redirects to the current week's grid", async ({ page }) => {
    // One URL family, one view: bare /calendar is a non-durable alias
    // for the current week (the Today dashboard lives at /today).
    await page.goto("/calendar");
    await page.waitForURL(/\/calendar\/\d{4}-W\d{2}$/);
    await expect(page.getByTestId("week-navigation")).toBeVisible();
  });

  test("/calendar/2026-W15 shows that week", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByTestId("week-navigation")).toBeVisible();
    await expect(
      page.getByTestId("week-navigation").getByText(/· W15/)
    ).toBeVisible();
  });

  test("/nonexistent redirects to /today", async ({ page }) => {
    await page.goto("/nonexistent");
    await page.waitForURL(/\/today/);
    expect(page.url()).toContain("/today");
  });

  test('Header "Today" button navigates to the Today page', async ({
    page,
  }) => {
    await page.goto("/workout/new?source=scratch");
    await page.getByTestId("status-header-today-button").click();
    await page.waitForURL(/\/today$/);
    await expect(page.getByTestId("today-page")).toBeVisible();
  });

  test('Header "Calendar" button navigates to the current week grid', async ({
    page,
  }) => {
    await page.goto("/workout/new?source=scratch");
    await page.getByTestId("status-header-calendar-button").click();
    await page.waitForURL(/\/calendar\/\d{4}-W\d{2}$/);
    await expect(page.getByTestId("week-navigation")).toBeVisible();
  });

  test("Kaiord logo navigates to /today (SPA, no reload)", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByTestId("calendar-page")).toBeVisible();

    // Set a JS variable to prove no full reload happens
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__SPA_NAV_CHECK__ = true;
    });

    await page.getByRole("link", { name: /Kaiord Editor/i }).click();
    // The logo is the durable "home" link → /today since the split.
    await page.waitForURL(/\/today$/);
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

  test('Week-nav "Today" button returns to the current week grid', async ({
    page,
  }) => {
    await page.goto("/calendar/2026-W01");
    await expect(page.getByText(/· W01/)).toBeVisible();

    await page
      .getByTestId("week-navigation")
      .getByRole("button", { name: "Today" })
      .click();

    // goToday now navigates to the current week's grid (staying inside
    // the calendar surface), not back to the Today summary.
    await page.waitForURL(/\/calendar\/\d{4}-W\d{2}$/);
    await expect(page.getByTestId("week-navigation")).toBeVisible();
  });

  test("Invalid week ID redirects to the current week grid", async ({
    page,
  }) => {
    await page.goto("/calendar/bad-week");
    // CalendarPage retargets an unparseable week to the CONCRETE current
    // week (1-hop) since bare /calendar is itself a redirect.
    await page.waitForURL(/\/calendar\/\d{4}-W\d{2}$/);
    await expect(page.getByTestId("week-navigation")).toBeVisible();
  });
});
