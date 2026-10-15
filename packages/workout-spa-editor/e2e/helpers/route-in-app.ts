/**
 * Move to another route inside the running app, the way a link does.
 *
 * `page.goto` (see `fixtures/base`) tears the document down and boots the app
 * again. Under the dev server one boot re-requests the whole module graph,
 * about a thousand files, so a flow that crosses five screens pays five cold
 * boots before it asserts anything. A spec whose subject is the data, not the
 * boot, changes the fragment instead: the app re-routes in the same document
 * and its live queries read the rows the previous screen wrote.
 *
 * Contract:
 * - `route` is an in-app route and starts with "/" (`/calendar`, not
 *   `#/calendar`); query strings ride along (`/workout/new?date=…`).
 * - Assigning the hash the page already has fires no `hashchange`, so routing
 *   to the current route is a no-op: the screen keeps its state.
 * - `hashchange` is handled after this call's `evaluate` returns, so until
 *   the app re-renders the OLD screen is still on the page. The helper
 *   therefore waits for `landmark`, an element only the target screen
 *   renders; without that wait a negative assertion that follows
 *   (`toHaveCount(0)`) would pass against the screen being left.
 */

import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function routeInApp(
  page: Page,
  route: string,
  landmark: Locator,
  options?: { timeout?: number }
): Promise<void> {
  if (!route.startsWith("/"))
    throw new Error(`routeInApp expects a route starting with "/": ${route}`);
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, `#${route}`);
  await expect(landmark).toBeVisible(options);
}
