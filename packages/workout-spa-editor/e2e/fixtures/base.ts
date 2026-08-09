/**
 * Base test fixture: translates a route into a URL, and retries navigation
 * on transient browser crashes.
 *
 * ROUTE → URL. The SPA carries its route in the fragment, so the browser only
 * ever requests a path that exists and every route answers 200 on the first
 * request (see `openspec/specs/spa-routing/spec.md`). A spec names the route
 * it wants — `/calendar` — and this is the single place that knows how a route
 * is spelled in the address bar. Absolute URLs are left alone: the specs that
 * use them are addressing a static server directly, not the app.
 *
 * RETRIES. It retries `page.goto` and `page.reload` on transient
 * browser-internal crashes (see `TRANSIENT_NAV_CRASH`): WebKit on CI
 * intermittently aborts a navigation with "WebKit encountered an internal
 * error" (and processes can crash).
 * WebKit also aborts back-to-back navigations with "Frame load interrupted",
 * "is interrupted by another navigation", or "Navigation canceled by policy
 * check" while it is still settling the PREVIOUS one — the named interruptor
 * is the residue of a navigation that already resolved, not app logic. These
 * are not test failures — re-issuing the same navigation recovers — so we
 * retry in-place a bounded number of times. Any other navigation error
 * propagates unchanged, and the retry is narrow enough that normal
 * navigations are untouched: a page that genuinely fails to load reports a
 * net error, and an app that renders the wrong thing still fails its
 * assertions.
 */

import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

const TRANSIENT_NAV_CRASH =
  /encountered an internal error|target crashed|page crashed|Frame load interrupted|is interrupted by another navigation|Navigation canceled by policy check/i;
const GOTO_CRASH_RETRIES = 2;

/**
 * The address-bar form of an in-app route. Exported for the rare caller that
 * navigates a page this fixture does not own (a second tab opened from the
 * context), which would otherwise bypass the translation.
 */
export function appUrl(route: string): string {
  if (!route.startsWith("/")) return route;
  if (route.startsWith("/#")) return route;
  return `/#${route}`;
}

async function retryingTransientCrash<T>(
  navigate: () => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= GOTO_CRASH_RETRIES; attempt++) {
    try {
      return await navigate();
    } catch (error) {
      lastError = error;
      const transient =
        error instanceof Error && TRANSIENT_NAV_CRASH.test(error.message);
      if (!transient) throw error;
    }
  }
  throw lastError;
}

const documentOf = (href: string): string => href.split("#")[0];

/** Whether navigating to `target` would only move the fragment. */
function staysInSameDocument(current: string, target: string): boolean {
  if (!current || current === "about:blank") return false;
  try {
    return documentOf(new URL(target, current).href) === documentOf(current);
  } catch {
    return false;
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    page.goto = (async (url, options) => {
      const target = appUrl(url);
      if (staysInSameDocument(page.url(), target)) {
        // Now that the route lives in the fragment, a second `goto` in the
        // same test would be a same-document navigation: the app keeps
        // running and merely re-routes. Specs use `goto` to mean "load this
        // route from scratch" — seed Dexie, then navigate — so the document
        // is torn down first. Blanking, not reloading: a reload boots the app
        // at the new route and immediately tears it down again, which is the
        // second-navigation-racing-the-mount shape that used to dominate the
        // WebKit flakes (see `helpers/seed-empty-workout`).
        await retryingTransientCrash(() => originalGoto("about:blank"));
      }
      return await retryingTransientCrash(() => originalGoto(target, options));
    }) as Page["goto"];

    // `reload` is the same operation through another door, and it aborts the
    // same way: `page.reload: Frame load interrupted` on WebKit. Protecting
    // only `goto` left ~20 call sites exposed to a failure mode this fixture
    // already knows how to name.
    const originalReload = page.reload.bind(page);
    page.reload = ((options) =>
      retryingTransientCrash(() => originalReload(options))) as Page["reload"];

    await use(page);
  },
});

export { expect } from "@playwright/test";
