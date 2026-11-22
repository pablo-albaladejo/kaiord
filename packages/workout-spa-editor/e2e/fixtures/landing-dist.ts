import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Stands in for the landing's error page. It carries a `<head>`, because the
// legacy-path bridge is injected into it, and a marker so a test can name
// what it must not see.
const HOST_404 =
  "<!DOCTYPE html><html><head><title>Page not found</title></head>" +
  '<body><p data-testid="host-404">This page does not exist.</p></body></html>';

/**
 * The landing directory to assemble: a bare 404 page by default, or the
 * landing's own build for a spec that judges landing pages. CI's
 * e2e-prod-base job consumes that build as an artifact; locally, run
 * `pnpm --filter @kaiord/landing build` first.
 */
export function prepareLanding(
  dir: string,
  repoRoot: string,
  real: boolean
): string {
  if (real) {
    const built = join(repoRoot, "packages/landing/dist");
    if (!existsSync(join(built, "index.html"))) {
      throw new Error(
        `${built} is missing. Build it with \`pnpm --filter @kaiord/landing build\`.`
      );
    }
    return built;
  }
  const stub = join(dir, "landing");
  mkdirSync(stub);
  writeFileSync(join(stub, "404.html"), HOST_404);
  return stub;
}
