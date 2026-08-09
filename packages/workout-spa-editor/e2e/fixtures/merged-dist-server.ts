import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  startStaticPagesServer,
  type StaticPagesServer,
} from "./static-pages-server";

// Serves the built SPA the way the static host does. The dev server answers
// 200 for every path, so it cannot tell a URL that resolves from one that only
// appears to — which is how a 404 on every deep link coexisted with a green
// suite for months. Every spec that makes a claim about status codes serves
// through here.
//
// The build itself happens once, in `prod-base-global-setup`.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..");

export const APP_BASE = "/app/";

// Stands in for the landing's error page. It carries a `<head>`, because the
// legacy-path bridge is injected into it, and a marker so a test can name
// what it must not see.
const HOST_404 =
  "<!DOCTYPE html><html><head><title>Page not found</title></head>" +
  '<body><p data-testid="host-404">This page does not exist.</p></body></html>';

export type MergedDist = {
  server: StaticPagesServer;
  /** The address-bar URL of an in-app route on the served artifact. */
  routeUrl: (route: string) => string;
  close: () => Promise<void>;
};

const builtDist = join(repoRoot, "packages/workout-spa-editor/dist");

/**
 * Fails loudly on an artifact built for another base. A `dist/` left by a
 * plain `pnpm build` would serve, and every asset would 404 — a confusing
 * shape for a suite whose whole subject is status codes.
 */
function assertBuiltForAppBase(indexHtml: string): void {
  if (!indexHtml.includes(`${APP_BASE}assets/`)) {
    throw new Error(
      `packages/workout-spa-editor/dist was not built with VITE_BASE_PATH=${APP_BASE}. ` +
        "The production-base run builds it in global setup; run it with E2E_PROD_BASE=1."
    );
  }
}

export async function startMergedDist(label: string): Promise<MergedDist> {
  const builtIndex = join(builtDist, "index.html");
  if (!existsSync(builtIndex)) {
    throw new Error(
      `${builtIndex} is missing. The production-base run builds it in global setup ` +
        "(`e2e/fixtures/prod-base-global-setup.ts`), which only runs with E2E_PROD_BASE=1."
    );
  }
  assertBuiltForAppBase(readFileSync(builtIndex, "utf8"));

  const dir = mkdtempSync(join(tmpdir(), `merged-dist-${label}-`));
  mkdirSync(join(dir, "app"), { recursive: true });
  cpSync(builtDist, join(dir, "app"), { recursive: true });
  writeFileSync(join(dir, "404.html"), HOST_404);

  execSync(`node scripts/inject-spa-fallback.mjs ${dir}`, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  const server = await startStaticPagesServer(dir);

  return {
    server,
    routeUrl: (route) => `${server.url}${APP_BASE}#${route}`,
    close: async () => {
      await server.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
