#!/usr/bin/env tsx
/**
 * LIVE, LOCAL ONLY, INERT IN CI. The workout-parser suite over the
 * maintainer's Claude Code subscription (`claude -p`), reached through
 * `loadLiveModel`. Detection refuses with `INERT: claude CLI not available`
 * when `CI` is set, when `EVAL_LIVE` is not `1` (only `pnpm eval:live` sets
 * it), or when the CLI is missing, logged out, or not on the claude.ai
 * subscription. It cannot run where merges are decided, so it carries no pass
 * threshold: it reports per-case counts (k of n with `--repeat N`) and exits
 * on a literal. A floor is a decision for later, derived from a measured A/A
 * run, and it would gate the keyless replay lane, never this one.
 *
 *   pnpm --filter @kaiord/ai eval:live                  one pass
 *   pnpm --filter @kaiord/ai eval:live -- --repeat 5    five passes, k of n
 *   pnpm --filter @kaiord/ai eval:live -- --record      one cassette per case
 *   pnpm --filter @kaiord/ai eval:live -- --calibrate   the calibration step
 *
 * Exit 0: the pass ran or stopped on a limit (rate limit, call budget), every
 * case reported. Exit 1: inert or misconfigured (a bad argument included), no
 * model call made. Exit 2: a harness fault or a context leak stopped the pass.
 * The body is `runLiveMain`, tested with injected doubles; this file only maps
 * its outcome to a literal exit code.
 *
 * `pnpm eval` (without `:live`) stays inert only while `EVAL_LIVE` is not
 * exported in the shell: it does not unset the opt-in, it just never sets it.
 */
import { join } from "node:path";
import { ITERATION_DIR } from "./claude-cli/cassette-writer";
import { runLiveMain } from "./claude-cli/live-main";
import { loadLiveModel } from "./claude-cli/load-live-model";

const PACKAGE_DIR = join(import.meta.dirname, "..", "..");

// The parity gaps are declared once in the report, not logged per call.
globalThis.AI_SDK_LOG_WARNINGS = false;

runLiveMain({
  argv: process.argv.slice(2),
  load: () => loadLiveModel(),
  log: (line) => console.log(line),
  error: (line) => console.error(line),
  reportDir: PACKAGE_DIR,
  calibrationDir: ITERATION_DIR,
}).then(
  (outcome) => {
    if (outcome === "fault") process.exit(2);
    if (outcome === "refused") process.exit(1);
    process.exit(0);
  },
  () => process.exit(2)
);
