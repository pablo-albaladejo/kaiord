import { execSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import {
  startStaticPagesServer,
  type StaticPagesServer,
} from "./fixtures/static-pages-server";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");

const ENABLED = process.env.E2E_PROD_BASE === "1";

test.describe("@spa-route-refresh SPA route refresh", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let server: StaticPagesServer;
  let mergedDist: string;

  test.beforeAll(async () => {
    // The build is website-id-agnostic: the Umami website id is not a Vite
    // build-time env var. Test 4 exercises the real adapter path by injecting
    // `window.__KAIORD_CONFIG__` (and a fake `umami` tracker) via
    // `page.addInitScript` before navigation — matching the deploy-time
    // runtime-config injection model.
    execSync("pnpm --filter @kaiord/workout-spa-editor build", {
      cwd: repoRoot,
      env: {
        ...process.env,
        VITE_BASE_PATH: "/editor/",
      },
      stdio: "inherit",
    });

    mergedDist = mkdtempSync(join(tmpdir(), "merged-dist-"));
    mkdirSync(join(mergedDist, "editor"), { recursive: true });
    cpSync(
      join(repoRoot, "packages/workout-spa-editor/dist"),
      join(mergedDist, "editor"),
      { recursive: true }
    );
    writeFileSync(
      join(mergedDist, "404.html"),
      "<!DOCTYPE html><html><body>404</body></html>"
    );

    execSync(`node scripts/inject-spa-fallback.mjs ${mergedDist}`, {
      cwd: repoRoot,
      stdio: "inherit",
    });

    server = await startStaticPagesServer(mergedDist);
  });

  test.afterAll(async () => {
    if (server) await server.close();
    if (mergedDist) rmSync(mergedDist, { recursive: true, force: true });
  });

  test("Test 1 — direct deep refresh restores URL and SPA bundle", async ({
    page,
  }) => {
    await page.goto(`${server.url}/editor/calendar`, { waitUntil: "load" });
    // Bare /calendar is a replace-redirect to the current week since the
    // /today split, so the restored deep link settles on /editor/calendar/:weekId.
    await page.waitForFunction(() =>
      /^\/editor\/calendar\/\d{4}-W\d{2}$/.test(window.location.pathname)
    );

    expect(page.url()).toMatch(/\/editor\/calendar\/\d{4}-W\d{2}$/);
    const scriptCount = await page
      .locator('script[src^="/editor/assets/index-"]')
      .count();
    expect(scriptCount).toBeGreaterThan(0);
  });

  test("Test 2 — in-app navigation prefixes URL", async ({ page }) => {
    await page.goto(`${server.url}/editor/`, { waitUntil: "load" });
    await page.waitForFunction(
      () => /^\/editor\/calendar\/\d{4}-W\d{2}$/.test(window.location.pathname),
      null,
      {
        timeout: 15_000,
      }
    );

    // Compare on pathname, not the full URL: a base-less regex matches both
    // `/calendar/...` and `/editor/calendar/...`, which is the opposite of
    // the distinction this test exists to make.
    const pathname = new URL(page.url()).pathname;
    expect(pathname).toMatch(/^\/editor\/calendar\/\d{4}-W\d{2}$/);
  });

  test("Test 3 — refresh inside SPA stays on the calendar week", async ({
    page,
  }) => {
    await page.goto(`${server.url}/editor/`, { waitUntil: "load" });
    await page.waitForFunction(
      () => /^\/editor\/calendar\/\d{4}-W\d{2}$/.test(window.location.pathname),
      null,
      {
        timeout: 15_000,
      }
    );
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(
      () => /^\/editor\/calendar\/\d{4}-W\d{2}$/.test(window.location.pathname),
      null,
      {
        timeout: 15_000,
      }
    );

    expect(page.url()).toMatch(/\/editor\/calendar\/\d{4}-W\d{2}$/);
  });

  test("Test 4 — analytics path remains base-relative", async ({ page }) => {
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
      // payload-modifier form: track(props => ({ ...props, url })).
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

    await page.goto(`${server.url}/editor/calendar`, { waitUntil: "load" });
    await page.waitForFunction(() =>
      /^\/editor\/calendar\/\d{4}-W\d{2}$/.test(window.location.pathname)
    );
    // Poll for the pageView event captured via the exposed function — wouter's
    // useEffect-driven emission lands a tick after the route resolves.
    await expect
      .poll(() => captured.length, { timeout: 5000 })
      .toBeGreaterThanOrEqual(1);

    // Base-relative (no /editor prefix); the bare-/calendar replace-redirect
    // means the first emitted path may already carry the concrete weekId.
    expect(captured[0]).toMatch(/^\/calendar(\/\d{4}-W\d{2})?$/);
    expect(captured[0]).not.toBe("/editor/calendar");
  });

  test("Test 5 — garbage path resolves to catch-all", async ({ page }) => {
    await page.goto(
      `${server.url}/editor/totally-malformed-path-${Date.now()}`,
      {
        waitUntil: "load",
      }
    );
    await page.waitForFunction(
      () => /^\/editor\/calendar\/\d{4}-W\d{2}$/.test(window.location.pathname),
      null,
      {
        timeout: 15_000,
      }
    );

    expect(page.url()).toMatch(/\/editor\/calendar\/\d{4}-W\d{2}$/);
  });
});
