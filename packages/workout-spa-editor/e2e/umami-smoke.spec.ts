/**
 * Umami analytics smoke: drives the minimal editor flow that was DEAD under
 * the old Cloudflare adapter (the editor's `window.cfBeacon.pushEvent` calls
 * targeted an API that never existed) and asserts each action produces a real
 * POST to Umami's ingest endpoint (`cloud.umami.is/api/send`).
 *
 * How it works (deterministic, no external network, no real dashboard data):
 *   1. `page.route` neutralizes the CDN tracker script the index.html loader
 *      appends, so it cannot overwrite our stub.
 *   2. `page.route` captures every `/api/send` POST and short-circuits it.
 *   3. `addInitScript` turns analytics ON (dev is otherwise noop) by seeding
 *      `window.__KAIORD_CONFIG__.umamiWebsiteId`, and stubs `window.umami`
 *      with a tracker that mirrors real Umami: the string form is a named
 *      event, the function form is a page view. Both POST to `/api/send`.
 *
 * The production path exercised end-to-end is: real adapter
 * (`createUmamiAnalytics` in main.tsx) -> the real `analytics.event(...)` call
 * sites -> `window.umami.track(...)` -> network POST.
 *
 * Run just this spec: `pnpm test:e2e -- --grep @umami-smoke --project=chromium`
 */
import { expect, test } from "./fixtures/base";
import { seedEmptyWorkout } from "./helpers/seed-empty-workout";

const TEST_WEBSITE_ID = "a5b4bf9b-c58d-450b-a9ba-feef821a85ae";

const KRD_WORKOUT = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: new Date().toISOString(), sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Smoke Test Workout",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: { type: "power", value: { unit: "watts", value: 200 } },
          intensity: "warmup",
        },
      ],
    },
  },
};

type SentEvent = { name?: string; url?: string; data?: { format?: string } };

test.describe("@umami-smoke Umami analytics smoke", () => {
  let sent: SentEvent[];

  test.beforeEach(async ({ page }) => {
    sent = [];

    // (1) Stub out the CDN tracker so it cannot replace our window.umami.
    await page.route("**/cloud.umami.is/script.js", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: "/* stubbed in umami-smoke */",
      })
    );

    // (2) Capture every ingest POST and short-circuit it (no real network,
    //     no data written to the real Umami dashboard).
    await page.route("**/api/send", async (route) => {
      try {
        const body = JSON.parse(route.request().postData() ?? "{}");
        sent.push(body.payload ?? body);
      } catch {
        // ignore malformed bodies
      }
      await route.fulfill({
        status: 200,
        headers: { "access-control-allow-origin": "*" },
        contentType: "text/plain",
        body: "1",
      });
    });

    // (3) Turn analytics ON and stub window.umami before any app code runs.
    await page.addInitScript((websiteId: string) => {
      const w = window as unknown as {
        __KAIORD_CONFIG__?: { umamiWebsiteId?: string };
        umami?: { track: (nameOrFn: unknown, data?: unknown) => void };
      };
      w.__KAIORD_CONFIG__ = { umamiWebsiteId: websiteId };

      const send = (payload: Record<string, unknown>) =>
        fetch("https://cloud.umami.is/api/send", {
          method: "POST",
          // text/plain keeps it a CORS "simple request" (no preflight).
          headers: { "content-type": "text/plain" },
          body: JSON.stringify({
            type: "event",
            payload: { website: websiteId, ...payload },
          }),
          keepalive: true,
        }).catch(() => undefined);

      w.umami = {
        track: (nameOrFn: unknown, data?: unknown) => {
          if (typeof nameOrFn === "function") {
            // Page-view path: the adapter passes a payload modifier that sets
            // the base-relative url.
            const modify = nameOrFn as (p: { url: string }) => { url: string };
            const result = modify({ url: window.location.pathname });
            send({ url: result.url });
          } else {
            send({
              name: nameOrFn as string,
              data: data as Record<string, unknown> | undefined,
            });
          }
        },
      };
    }, TEST_WEBSITE_ID);
  });

  test("should post editor-loaded, a page view, import and export to Umami", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/workout/new?source=scratch");
    await expect(page.locator("[data-route-heading]")).toBeAttached();

    // Assert — mount fires editor-loaded and a page view for the route
    await expect
      .poll(() => sent.some((e) => e.name === "editor-loaded"))
      .toBe(true);
    await expect
      .poll(() => sent.some((e) => e.url === "/workout/new"))
      .toBe(true);

    // Act — import a KRD file (fires workout-imported)
    await seedEmptyWorkout(page);
    await page.getByTestId("file-upload-input").setInputFiles({
      name: "smoke.krd",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(KRD_WORKOUT)),
    });
    await expect(page.getByText("Smoke Test Workout")).toBeVisible({
      timeout: 10000,
    });

    // Assert — workout-imported posted with the detected format
    await expect
      .poll(() => sent.find((e) => e.name === "workout-imported")?.data?.format)
      .toBe("krd");

    // Act — export to FIT (fires workout-exported)
    await page.getByTestId("export-format-selector-button").click();
    await page.getByTestId("export-format-option-fit").click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /save workout/i }).click();
    await downloadPromise;

    // Assert — workout-exported posted with format=fit
    await expect
      .poll(() => sent.find((e) => e.name === "workout-exported")?.data?.format)
      .toBe("fit");
  });
});
