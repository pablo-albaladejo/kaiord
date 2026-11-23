import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assembleForE2e, type AssembleOptions } from "./assemble-for-e2e";
import { builtDocs, builtLanding, stubLanding } from "./site-builds";
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

export type MergedDist = {
  server: StaticPagesServer;
  /** The assembled tree the server reads on every request. */
  site: string;
  /** Assembles the tree again in place: the next deploy. */
  reassemble: (options?: AssembleOptions) => void;
  /** The address-bar URL of an in-app route on the served artifact. */
  routeUrl: (route: string) => string;
  close: () => Promise<void>;
};

export const PROD_DIST_DIR = ".e2e-prod-dist";
const builtDist = join(repoRoot, "packages/workout-spa-editor", PROD_DIST_DIR);

/**
 * Fails loudly on an artifact built for another base. A tree built without
 * the `/app/` base would serve, and every asset would 404 — a confusing
 * shape for a suite whose whole subject is status codes.
 */
function assertBuiltForAppBase(indexHtml: string): void {
  if (!indexHtml.includes(`${APP_BASE}assets/`)) {
    throw new Error(
      `${builtDist} was not built with VITE_BASE_PATH=${APP_BASE}. ` +
        "The production-base run builds it in global setup; run it with E2E_PROD_BASE=1."
    );
  }
}

export async function startMergedDist(
  label: string,
  options: { realLanding?: boolean; withDocs?: boolean } = {}
): Promise<MergedDist> {
  const builtIndex = join(builtDist, "index.html");
  if (!existsSync(builtIndex)) {
    throw new Error(
      `${builtIndex} is missing. The production-base run builds it in global setup ` +
        "(`e2e/fixtures/prod-base-global-setup.ts`), which only runs with E2E_PROD_BASE=1."
    );
  }
  assertBuiltForAppBase(readFileSync(builtIndex, "utf8"));

  const dir = mkdtempSync(join(tmpdir(), `merged-dist-${label}-`));
  const site = join(dir, "site");
  const landing = options.realLanding
    ? builtLanding(repoRoot)
    : stubLanding(dir);
  const docs = options.withDocs
    ? ["--docs", builtDocs(repoRoot)]
    : ["--without", "docs"];

  // The server reads the tree per request, so it listens first and the
  // assembly (the deploy's own) knows the origin the App's worker-src names.
  const server = await startStaticPagesServer(site);
  const assemble = (assembly?: AssembleOptions) =>
    assembleForE2e(
      { site, origin: server.url, landing, app: builtDist, docs, scratch: dir },
      assembly
    );
  assemble();

  return {
    server,
    site,
    reassemble: assemble,
    routeUrl: (route) => `${server.url}${APP_BASE}#${route}`,
    close: async () => {
      await server.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}
