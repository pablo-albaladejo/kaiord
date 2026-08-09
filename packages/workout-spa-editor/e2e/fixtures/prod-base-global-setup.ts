import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { APP_BASE } from "./merged-dist-server";

// One build for the whole production-base run.
//
// Two spec files need the same artifact. Building it in each `beforeAll` put
// two `vite build` processes on the same `dist/`, and whenever the workers
// overlapped one of them died on `ENOTEMPTY` while the other was emptying the
// output directory. Playwright runs global setup once, before any worker, so
// the artifact exists before anything reads it.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..");

export default function buildProdArtifact(): void {
  execSync("pnpm --filter @kaiord/workout-spa-editor build", {
    cwd: repoRoot,
    env: { ...process.env, VITE_BASE_PATH: APP_BASE },
    stdio: "inherit",
  });
}
