import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Stands in for the landing's error page. It carries a `<head>`, because the
// legacy-path bridge is injected into it, and a marker so a test can name
// what it must not see.
const HOST_404 =
  "<!DOCTYPE html><html><head><title>Page not found</title></head>" +
  '<body><p data-testid="host-404">This page does not exist.</p></body></html>';

/** A bare landing holding only its 404 page, written under `dir`. */
export function stubLanding(dir: string): string {
  const stub = join(dir, "landing");
  mkdirSync(stub);
  writeFileSync(join(stub, "404.html"), HOST_404);
  return stub;
}

const requireBuild = (built: string, filter: string): string => {
  if (!existsSync(join(built, "index.html"))) {
    throw new Error(
      `${built} is missing. Build it with \`pnpm --filter ${filter} build\`.`
    );
  }
  return built;
};

/**
 * The landing's own build, for a spec that judges landing pages. CI's
 * e2e-prod-base job consumes that build as an artifact.
 */
export const builtLanding = (repoRoot: string): string =>
  requireBuild(join(repoRoot, "packages/landing/dist"), "@kaiord/landing");

/**
 * The docs' VitePress build, for a spec that judges docs pages. CI's
 * e2e-prod-base job downloads it from the build job's `docs-dist` artifact.
 */
export const builtDocs = (repoRoot: string): string =>
  requireBuild(join(repoRoot, "packages/docs/.vitepress/dist"), "@kaiord/docs");
