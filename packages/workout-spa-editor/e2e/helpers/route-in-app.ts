/**
 * Move to another route inside the running app, the way a link does.
 *
 * `page.goto` (see `fixtures/base`) tears the document down and boots the app
 * again. Under the dev server one boot re-requests the whole module graph,
 * about a thousand files, so a flow that crosses five screens pays five cold
 * boots before it asserts anything. A spec whose subject is the data, not the
 * boot, changes the fragment instead: the app re-routes in the same document
 * and its live queries read the rows the previous screen wrote.
 */

import type { Page } from "@playwright/test";

export async function routeInApp(page: Page, route: string): Promise<void> {
  await page.evaluate((hash) => {
    window.location.hash = hash;
  }, `#${route}`);
}
