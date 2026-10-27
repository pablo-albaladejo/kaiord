import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { APP_BASE, PROD_DIST_DIR } from "./merged-dist-server";

// One build for the whole production-base run.
//
// It goes to its own gitignored `.e2e-prod-dist/`, never to `dist/`. Any other
// build in the same worktree (a plain `pnpm build`, a second e2e run) empties
// `dist/` on start, and a spec serving it mid-run then found no `index.html`.
//
// Two spec files need the same artifact. Building it in each `beforeAll` put
// two `vite build` processes on the same `dist/`, and whenever the workers
// overlapped one of them died on `ENOTEMPTY` while the other was emptying the
// output directory. Playwright runs global setup once, before any worker, so
// the artifact exists before anything reads it.

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..", "..");

export default function buildProdArtifact(): void {
  execSync(`pnpm exec vite build --outDir ${PROD_DIST_DIR} --emptyOutDir`, {
    cwd: packageRoot,
    env: { ...process.env, VITE_BASE_PATH: APP_BASE },
    stdio: "inherit",
  });
}
