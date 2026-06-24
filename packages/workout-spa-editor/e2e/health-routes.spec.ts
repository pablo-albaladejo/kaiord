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

// Each /health/* sub-route renders a dedicated page marked with a stable
// `data-testid` (see components/pages/health/*). The refresh test asserts the
// page survives a hard reload under the `/editor/` base (the SPA-fallback path),
// catching router-base regressions specific to these routes.
const HEALTH_ROUTES = [
  { path: "sleep", testId: "health-sleep" },
  { path: "weight", testId: "health-weight" },
  { path: "recovery", testId: "health-recovery" },
  { path: "activity", testId: "health-activity" },
] as const;

const RENDER_TIMEOUT_MS = 15_000;

// Tagged @spa-route-refresh so the production-base CI job
// (`test:e2e --grep '@spa-route-refresh'`) picks these up.
test.describe("@spa-route-refresh health route refresh", () => {
  test.skip(!ENABLED, "Production-base e2e gated behind E2E_PROD_BASE=1");

  let server: StaticPagesServer;
  let mergedDist: string;

  test.beforeAll(async () => {
    execSync("pnpm --filter @kaiord/workout-spa-editor build", {
      cwd: repoRoot,
      env: { ...process.env, VITE_BASE_PATH: "/editor/" },
      stdio: "inherit",
    });

    mergedDist = mkdtempSync(join(tmpdir(), "merged-dist-health-"));
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

  for (const route of HEALTH_ROUTES) {
    test(`hard refresh on /health/${route.path} restores the route and renders`, async ({
      page,
    }) => {
      const path = `/editor/health/${route.path}`;
      const marker = page.getByTestId(route.testId);

      // Deep-load the route and confirm the dedicated page rendered.
      await page.goto(`${server.url}${path}`, { waitUntil: "load" });
      await expect(marker).toBeVisible({ timeout: RENDER_TIMEOUT_MS });

      // Hard refresh — exercises the static 404 -> SPA-fallback restore path.
      await page.reload({ waitUntil: "load" });

      // The route must re-render in place: same URL (no redirect to /health or
      // the calendar catch-all), the page marker present, and the SPA bundle
      // re-served under the /editor base.
      await expect(marker).toBeVisible({ timeout: RENDER_TIMEOUT_MS });
      expect(new URL(page.url()).pathname).toBe(path);
      const scriptCount = await page
        .locator('script[src^="/editor/assets/index-"]')
        .count();
      expect(scriptCount).toBeGreaterThan(0);
    });
  }
});
