/**
 * Each /health/* sub-route renders a dedicated page marked with a stable
 * `data-testid` (see components/pages/health/*). These routes are deep enough
 * to have been the first to show the host's error page, so they are checked on
 * the served artifact rather than the dev server: cold load and hard refresh
 * both answer 200, and the page re-renders in place.
 */

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  APP_BASE,
  type MergedDist,
  startMergedDist,
} from "./fixtures/merged-dist-server";

const ENABLED = process.env.E2E_PROD_BASE === "1";

const HEALTH_ROUTES = [
  { path: "sleep", testId: "health-sleep" },
  { path: "weight", testId: "health-weight" },
  { path: "recovery", testId: "health-recovery" },
  { path: "activity", testId: "health-activity" },
] as const;

const RENDER_TIMEOUT_MS = 15_000;

function documentStatuses(page: Page): number[] {
  const statuses: number[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "document") {
      statuses.push(response.status());
    }
  });
  return statuses;
}

// Tagged @spa-route-refresh so the production-base CI job
// (`test:e2e --grep '@spa-route-refresh'`) picks these up.
test.describe("@spa-route-refresh health route refresh", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("health");
  });

  test.afterAll(async () => {
    if (dist) await dist.close();
  });

  for (const route of HEALTH_ROUTES) {
    test(`hard refresh on /health/${route.path} keeps the route and renders`, async ({
      page,
    }) => {
      const statuses = documentStatuses(page);
      const hash = `#/health/${route.path}`;
      const marker = page.getByTestId(route.testId);

      // Deep-load the route and confirm the dedicated page rendered.
      const response = await page.goto(dist.routeUrl(`/health/${route.path}`), {
        waitUntil: "load",
      });
      expect(response?.status()).toBe(200);
      await expect(marker).toBeVisible({ timeout: RENDER_TIMEOUT_MS });

      // Hard refresh — the case that used to round-trip through the error page.
      await page.reload({ waitUntil: "load" });

      // The route must re-render in place: same URL (no redirect to /health or
      // the calendar catch-all), the page marker present, the SPA bundle
      // re-served under the deploy base, and no error response on either load.
      await expect(marker).toBeVisible({ timeout: RENDER_TIMEOUT_MS });
      expect(await page.evaluate(() => window.location.hash)).toBe(hash);
      expect(await page.evaluate(() => window.location.pathname)).toBe(
        APP_BASE
      );
      const scriptCount = await page
        .locator(`script[src^="${APP_BASE}assets/index-"]`)
        .count();
      expect(scriptCount).toBeGreaterThan(0);
      expect(statuses).toEqual([200, 200]);
    });
  }
});
