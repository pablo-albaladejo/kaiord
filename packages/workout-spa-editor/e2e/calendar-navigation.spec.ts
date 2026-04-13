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

  test("/calendar shows the calendar page", async ({ page }) => {
    await page.goto("/calendar");
    await expect(page.getByTestId("calendar-page")).toBeVisible();
  });

  test("/calendar/2026-W15 shows that week", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByTestId("week-navigation")).toBeVisible();
    await expect(
      page.getByTestId("week-navigation").getByText("2026 W15")
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
    await page.goto("/workout/new");
    await page.getByRole("button", { name: "Go to calendar" }).click();
    await page.waitForURL(/\/calendar/);
    await expect(page.getByTestId("calendar-page")).toBeVisible();
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
    await page.waitForURL(/\/calendar(?!\/2026-W15)/);

    const survived = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__SPA_NAV_CHECK__
    );
    expect(survived).toBe(true);
  });

  test("Click prev week changes URL", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByText("2026 W15")).toBeVisible();

    await page.getByRole("button", { name: "Previous week" }).click();
    await page.waitForURL(/\/calendar\/2026-W14/);
    await expect(page.getByText("2026 W14")).toBeVisible();
  });

  test("Click next week changes URL", async ({ page }) => {
    await page.goto("/calendar/2026-W15");
    await expect(page.getByText("2026 W15")).toBeVisible();

    await page.getByRole("button", { name: "Next week" }).click();
    await page.waitForURL(/\/calendar\/2026-W16/);
    await expect(page.getByText("2026 W16")).toBeVisible();
  });

  test('Click "Today" navigates to current week', async ({ page }) => {
    await page.goto("/calendar/2026-W01");
    await expect(page.getByText("2026 W01")).toBeVisible();

    await page.getByRole("button", { name: "Today" }).click();

    // Should navigate away from W01
    await page.waitForURL(/\/calendar(?!\/2026-W01)/);
    await expect(page.getByTestId("calendar-page")).toBeVisible();
  });

  test("Invalid week ID redirects to /calendar", async ({ page }) => {
    await page.goto("/calendar/bad-week");
    await page.waitForURL(/\/calendar(?!\/bad-week)/);
    await expect(page.getByTestId("calendar-page")).toBeVisible();
  });
});
