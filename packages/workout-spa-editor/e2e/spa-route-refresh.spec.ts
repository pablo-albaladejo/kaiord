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
    execSync("pnpm --filter @kaiord/workout-spa-editor build", {
      cwd: repoRoot,
      env: {
        ...process.env,
        VITE_BASE_PATH: "/editor/",
        // The Cloudflare adapter no-ops without a token. Setting a placeholder
        // exercises the real adapter path so Test 4 can verify analytics.pageView
        // fires with the base-stripped wouter path.
        VITE_CF_ANALYTICS_TOKEN: "e2e-test-token",
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
    await page.waitForFunction(
      () => window.location.pathname === "/editor/calendar"
    );

    expect(page.url()).toMatch(/\/editor\/calendar$/);
    const scriptCount = await page
      .locator('script[src^="/editor/assets/index-"]')
      .count();
    expect(scriptCount).toBeGreaterThan(0);
  });

  test("Test 2 — in-app navigation prefixes URL", async ({ page }) => {
    await page.goto(`${server.url}/editor/`, { waitUntil: "load" });
    await page.waitForFunction(
      () => window.location.pathname === "/editor/calendar",
      null,
      {
        timeout: 15_000,
      }
    );

    expect(page.url()).toMatch(/\/editor\/calendar$/);
    expect(page.url()).not.toMatch(/\/calendar$/);
  });

  test("Test 3 — refresh inside SPA stays at /editor/calendar", async ({
    page,
  }) => {
    await page.goto(`${server.url}/editor/`, { waitUntil: "load" });
    await page.waitForFunction(
      () => window.location.pathname === "/editor/calendar",
      null,
      {
        timeout: 15_000,
      }
    );
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(
      () => window.location.pathname === "/editor/calendar",
      null,
      {
        timeout: 15_000,
      }
    );

    expect(page.url()).toMatch(/\/editor\/calendar$/);
  });

  test("Test 4 — analytics path remains base-relative", async ({ page }) => {
    const captured: string[] = [];
    await page.exposeFunction("__captureAnalytics", (path: string) => {
      captured.push(path);
    });
    await page.addInitScript(() => {
      // Plant a fake cfBeacon so the production Cloudflare analytics adapter
      // routes pushEvent calls into our capture instead of the network.
      Object.defineProperty(window, "cfBeacon", {
        value: {
          pushEvent: (name: string, props?: { path?: string }) => {
            if (name === "pageView" && props?.path) {
              // @ts-expect-error — exposed via exposeFunction
              window.__captureAnalytics(props.path);
            }
          },
        },
        writable: true,
        configurable: true,
      });
    });

    await page.goto(`${server.url}/editor/calendar`, { waitUntil: "load" });
    await page.waitForFunction(
      () => window.location.pathname === "/editor/calendar"
    );
    // Poll for the pageView event captured via the exposed function — wouter's
    // useEffect-driven emission lands a tick after the route resolves.
    await expect
      .poll(() => captured.length, { timeout: 5000 })
      .toBeGreaterThanOrEqual(1);

    expect(captured[0]).toBe("/calendar");
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
      () => window.location.pathname === "/editor/calendar",
      null,
      {
        timeout: 15_000,
      }
    );

    expect(page.url()).toMatch(/\/editor\/calendar$/);
  });
});
