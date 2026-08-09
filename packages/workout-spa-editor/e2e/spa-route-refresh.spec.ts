/**
 * The contract this suite exists for: a URL that resolves never answers 404
 * on the way to itself.
 *
 * Its previous shape asserted that the URL was *restored* after the host's
 * error page had already been served and painted — so it passed for months
 * while every deep link showed a 404 first. Restoration is not the property
 * that matters; the status code of the first response is. Every test here
 * counts document responses, and a 404 among them is a failure.
 */

import { expect, test } from "./fixtures/base";
import { documentStatuses } from "./fixtures/document-statuses";
import {
  APP_BASE,
  type MergedDist,
  startMergedDist,
} from "./fixtures/merged-dist-server";

const ENABLED = process.env.E2E_PROD_BASE === "1";
const RENDER_TIMEOUT_MS = 15_000;
const SETTLED_WEEK = /^#\/calendar\/\d{4}-W\d{2}$/;

test.describe("@spa-route-refresh SPA routes on the static host", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let dist: MergedDist;

  test.beforeAll(async () => {
    dist = await startMergedDist("routes");
  });

  test.afterAll(async () => {
    if (dist) await dist.close();
  });

  test("answers 200 on the first request to a deep route", async ({ page }) => {
    const statuses = documentStatuses(page);

    const response = await page.goto(dist.routeUrl("/calendar/2026-W32"), {
      waitUntil: "load",
    });

    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("calendar-page")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    // The requested week, not a catch-all landing.
    expect(await page.evaluate(() => window.location.hash)).toBe(
      "#/calendar/2026-W32"
    );
    expect(statuses).toEqual([200]);
    await expect(page.getByTestId("host-404")).toHaveCount(0);
  });

  test("answers 200 for an unbounded route that cannot be pre-generated", async ({
    page,
  }) => {
    // The case a file-per-route build could never cover, and the reason the
    // route had to leave the path.
    const statuses = documentStatuses(page);
    const uuid = "6e3ad6f0-1234-4cdf-9abc-1234567890ab";

    const response = await page.goto(dist.routeUrl(`/workout/${uuid}`), {
      waitUntil: "load",
    });

    expect(response?.status()).toBe(200);
    expect(statuses).toEqual([200]);
    expect(await page.evaluate(() => window.location.hash)).toBe(
      `#/workout/${uuid}`
    );
    const shell = await page
      .locator(`script[src^="${APP_BASE}assets/index-"]`)
      .count();
    expect(shell).toBeGreaterThan(0);
  });

  test("carries the query inside the fragment, where the app reads it", async ({
    page,
  }) => {
    // The shape none of the first six scenarios exercised, which is how a
    // router that filed the query somewhere the app does not read passed them
    // all. `?source=scratch` is what tells `/workout/new` to open the editor
    // directly instead of the AI Create overlay, so the two surfaces are the
    // observable difference between "read" and "lost".
    const statuses = documentStatuses(page);

    const response = await page.goto(
      dist.routeUrl("/workout/new?source=scratch"),
      { waitUntil: "load" }
    );

    expect(response?.status()).toBe(200);
    expect(statuses).toEqual([200]);
    await expect(page.getByTestId("scratch-schedule-button")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    await expect(page.getByTestId("create-workout")).toHaveCount(0);
    expect(await page.evaluate(() => window.location.search)).toBe("");
  });

  test("keeps the route across a refresh, one document request each time", async ({
    page,
  }) => {
    const statuses = documentStatuses(page);

    await page.goto(dist.routeUrl("/library"), { waitUntil: "load" });
    await expect(page.getByTestId("library-page")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    await page.reload({ waitUntil: "load" });

    await expect(page.getByTestId("library-page")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    expect(await page.evaluate(() => window.location.hash)).toBe("#/library");
    expect(statuses).toEqual([200, 200]);
  });

  test("resolves a malformed route through the catch-all, still 200", async ({
    page,
  }) => {
    const statuses = documentStatuses(page);

    await page.goto(dist.routeUrl("/totally-malformed-path"), {
      waitUntil: "load",
    });

    await expect(page.getByTestId("calendar-page")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    expect(await page.evaluate(() => window.location.hash)).toMatch(
      SETTLED_WEEK
    );
    expect(statuses).toEqual([200]);
  });

  test("bridges a legacy /editor path into the same route", async ({
    page,
  }) => {
    // The one 404 the change does not remove, and cannot: a URL already in the
    // wild still reaches the host's error page first. What is asserted is that
    // it costs exactly one bounce and lands on the route it named. That the
    // error page does not *paint* on the way is a question of where the script
    // sits in the document, which `scripts/inject-spa-fallback.test.mjs` pins
    // positionally — a browser cannot be asked what it nearly rendered.
    const statuses = documentStatuses(page);

    await page.goto(`${dist.server.url}/editor/calendar/2026-W32`, {
      waitUntil: "load",
    });

    await expect(page.getByTestId("calendar-page")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    expect(await page.evaluate(() => window.location.pathname)).toBe(APP_BASE);
    expect(await page.evaluate(() => window.location.hash)).toBe(
      "#/calendar/2026-W32"
    );
    expect(statuses).toEqual([404, 200]);
  });

  test("reports analytics paths base-relative, without the prefix or the fragment", async ({
    page,
  }) => {
    const captured: string[] = [];
    await page.exposeFunction("__captureAnalytics", (path: string) => {
      captured.push(path);
    });
    await page.addInitScript(() => {
      // Inject a runtime-config website id so the Umami analytics adapter
      // selects its real path (instead of the noop fallback). The value is
      // irrelevant — the adapter only checks for non-empty.
      Object.defineProperty(window, "__KAIORD_CONFIG__", {
        value: { umamiWebsiteId: "e2e-test-website-id" },
        writable: true,
        configurable: true,
      });
      // Plant a fake umami tracker so the production adapter routes track()
      // calls into our capture instead of the network. pageView uses the
      // payload-modifier form: track(props => ({ ...props, url })). The
      // default it is handed is `location.pathname`, which under hash routing
      // is the deploy prefix — so an adapter that stopped overriding it would
      // be caught here rather than silently reporting every view as `/app/`.
      Object.defineProperty(window, "umami", {
        value: {
          track: (
            nameOrModifier:
              string | ((props: { url?: string }) => { url?: string })
          ) => {
            if (typeof nameOrModifier !== "function") return;
            const payload = nameOrModifier({ url: window.location.pathname });
            if (payload?.url) {
              // @ts-expect-error — exposed via exposeFunction
              window.__captureAnalytics(payload.url);
            }
          },
        },
        writable: true,
        configurable: true,
      });
    });

    await page.goto(dist.routeUrl("/calendar"), { waitUntil: "load" });
    await expect(page.getByTestId("calendar-page")).toBeVisible({
      timeout: RENDER_TIMEOUT_MS,
    });
    // Poll for the pageView event captured via the exposed function — wouter's
    // useEffect-driven emission lands a tick after the route resolves.
    await expect
      .poll(() => captured.length, { timeout: 5000 })
      .toBeGreaterThanOrEqual(1);

    // Base-relative; the bare-/calendar replace-redirect means the first
    // emitted path may already carry the concrete weekId.
    expect(captured[0]).toMatch(/^\/calendar(\/\d{4}-W\d{2})?$/);
    expect(captured[0]).not.toContain("#");
    expect(captured[0]).not.toContain(APP_BASE);
  });
});
