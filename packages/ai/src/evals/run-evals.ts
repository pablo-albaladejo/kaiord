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
 * case reported. Exit 1: inert or misconfigured, no model call made. Exit 2: a
 * harness fault or a context leak stopped the pass.
 */
import { join } from "node:path";
import { calibrate } from "./claude-cli/calibration-call";
import {
  captureCalibration,
  writeCalibration,
} from "./claude-cli/calibration-capture";
import { ITERATION_DIR, serialize } from "./claude-cli/cassette-writer";
import { messageOf } from "./claude-cli/harness-fault";
import { parseLiveArgs } from "./claude-cli/live-args";
import { NOT_MEASURED_PREFIX } from "./claude-cli/live-config";
import { runLivePass } from "./claude-cli/live-pass";
import { writeLiveReport } from "./claude-cli/live-report";
import { buildLiveReport, formatLiveSummary } from "./claude-cli/live-summary";
import { loadLiveModel } from "./claude-cli/load-live-model";
import {
  parserLiveCases,
  recordingLiveCases,
} from "./claude-cli/parser-live-cases";
import { createParserReplaySuite } from "./cassettes/parser-replay-suite";

const PACKAGE_DIR = join(import.meta.dirname, "..", "..");

// The parity gaps are declared once in the report, not logged per call.
globalThis.AI_SDK_LOG_WARNINGS = false;

const loadOrExit = async () => {
  try {
    return await loadLiveModel();
  } catch (error) {
    const message = messageOf(error);
    console.error(message);
    if (!message.startsWith(NOT_MEASURED_PREFIX)) process.exit(1);
    for (const c of parserLiveCases()) console.log(`[UNMEASURED] ${c.id}`);
    process.exit(0);
  }
};

const runEvals = async () => {
  const args = parseLiveArgs(process.argv.slice(2));
  const live = await loadOrExit();
  if (args.calibrate) {
    const capture = await captureCalibration(live.session, live.modelId);
    console.log(serialize(capture));
    console.log(
      `Calibration saved to ${writeCalibration(capture, ITERATION_DIR)}`
    );
    process.exit(0);
  }
  const startedAt = new Date();
  const calibration = await calibrate(live.session, live.modelId);
  const suite = createParserReplaySuite(live.modelId);
  const cases = args.record
    ? recordingLiveCases(suite, undefined, (p) =>
        console.log(`  recorded ${p}`)
      )
    : parserLiveCases();
  const tallies = await runLivePass({
    session: live.session,
    model: live.model,
    cases,
    repetitions: args.repeat,
    onRun: (id, outcome) =>
      console.log(`[${outcome.status.toUpperCase()}] ${id}`),
  });
  const report = buildLiveReport({
    suite: "workout-parser",
    modelId: live.modelId,
    startedAt,
    repetitions: args.repeat,
    session: live.session,
    calibration,
    tallies,
  });
  console.log(`\n${formatLiveSummary(report)}`);
  console.log(`\nReport saved to ${writeLiveReport(report, PACKAGE_DIR)}`);
  const kind = report.stop?.kind;
  if (kind === "harness-fault" || kind === "context-leak") process.exit(2);
  process.exit(0);
};

runEvals().catch((error) => {
  console.error(messageOf(error));
  process.exit(2);
});
