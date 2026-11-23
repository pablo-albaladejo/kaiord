import { execFileSync } from "node:child_process";
import { cpSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..");

/** How a re-assembly differs from the first one, to stand in for a deploy. */
export type AssembleOptions = {
  /** Changes a copy of the App build before assembly: the next build. */
  build?: (app: string) => void;
  /** The kill switch: `--sw-kill`. */
  swKill?: boolean;
  /** Changes the assembled tree after assembly, as a stale edge would. */
  afterAssembly?: (site: string) => void;
};

export type AssemblyInputs = {
  site: string;
  /** The origin the tree is served from: the App's worker-src names it. */
  origin: string;
  landing: string;
  app: string;
  /** `["--docs", dir]` or `["--without", "docs"]`. */
  docs: string[];
  /** A directory this run owns, for a copy of the App build. */
  scratch: string;
};

/** Runs `scripts/assemble-site.mjs` into `site`, replacing what was there. */
export function assembleForE2e(
  { site, origin, landing, app, docs, scratch }: AssemblyInputs,
  assembly: AssembleOptions = {}
): void {
  rmSync(site, { recursive: true, force: true });
  let build = app;
  if (assembly.build) {
    build = join(scratch, "app-build");
    rmSync(build, { recursive: true, force: true });
    cpSync(app, build, { recursive: true });
    assembly.build(build);
  }
  execFileSync(
    process.execPath,
    [
      "scripts/assemble-site.mjs",
      ...["--out", site, "--landing", landing, "--app", build],
      ...docs,
      ...["--sha", "e2e", "--origin", origin],
      ...(assembly.swKill ? ["--sw-kill"] : []),
    ],
    { cwd: repoRoot, stdio: "inherit" }
  );
  assembly.afterAssembly?.(site);
}
