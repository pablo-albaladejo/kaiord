import { createParserReplaySuite } from "../cassettes/parser-replay-suite";
import { OFFICIAL_SERVED_FORM } from "../cassettes/validate-cassette";
import { calibrate } from "./calibration-call";
import { captureCalibration, writeCalibration } from "./calibration-capture";
import { serialize } from "./cassette-writer";
import type { CassetteTargets } from "./cassette-writer";
import { messageOf } from "./harness-fault";
import { parseLiveArgs } from "./live-args";
import type { LiveArgs } from "./live-args";
import { NOT_MEASURED_PREFIX } from "./live-config";
import { runLivePass } from "./live-pass";
import { writeLiveReport } from "./live-report";
import { buildLiveReport, formatLiveSummary } from "./live-summary";
import type { LiveModel } from "./load-live-model";
import { parserLiveCases, recordingLiveCases } from "./parser-live-cases";
import { recordPreflightFault } from "./served-model";

/** `ran` exits 0, `refused` 1 (inert or misconfigured), `fault` 2. */
export type LiveOutcome = "ran" | "refused" | "fault";

export type LiveMainDeps = {
  argv: ReadonlyArray<string>;
  load: () => Promise<LiveModel>;
  log: (line: string) => void;
  error: (line: string) => void;
  reportDir: string;
  calibrationDir: string;
  targets?: CassetteTargets;
};

const loadOrRefuse = async (deps: LiveMainDeps) => {
  try {
    return await deps.load();
  } catch (error) {
    const message = messageOf(error);
    deps.error(message);
    if (!message.startsWith(NOT_MEASURED_PREFIX)) return "refused";
    for (const c of parserLiveCases()) deps.log(`[UNMEASURED] ${c.id}`);
    return "ran";
  }
};

const runCalibration = async (deps: LiveMainDeps, live: LiveModel) => {
  const capture = await captureCalibration(live.session, live.modelId);
  deps.log(serialize(capture));
  const path = writeCalibration(capture, deps.calibrationDir);
  deps.log(`Calibration saved to ${path}`);
  return "ran" as const;
};

const runPass = async (
  deps: LiveMainDeps,
  live: LiveModel,
  args: LiveArgs
): Promise<LiveOutcome> => {
  const startedAt = new Date();
  const calibration = await calibrate(live.session, live.modelId);
  const suite = createParserReplaySuite(live.modelId);
  const cases = args.record
    ? recordingLiveCases(suite, deps.targets, (p) =>
        deps.log(`  recorded ${p}`)
      )
    : parserLiveCases();
  const tallies = await runLivePass({
    session: live.session,
    model: live.model,
    cases,
    repetitions: args.repeat,
    onRun: (id, o) => deps.log(`[${o.status.toUpperCase()}] ${id}`),
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
  deps.log(`\n${formatLiveSummary(report)}`);
  deps.log(`\nReport saved to ${writeLiveReport(report, deps.reportDir)}`);
  const kind = report.stop?.kind;
  return kind === "harness-fault" || kind === "context-leak" ? "fault" : "ran";
};

const runLive = async (deps: LiveMainDeps): Promise<LiveOutcome> => {
  const args = parseLiveArgs(deps.argv);
  const live = await loadOrRefuse(deps);
  if (typeof live === "string") return live;
  for (const path of live.managedSettings) {
    deps.log(
      `note: managed settings exist at ${path} (not read); they apply whatever --setting-sources says, so confirm they set no ANTHROPIC_BASE_URL`
    );
  }
  if (args.calibrate) return runCalibration(deps, live);
  const preflight = args.record
    ? recordPreflightFault(
        live.modelId,
        deps.targets?.servedForm ?? OFFICIAL_SERVED_FORM
      )
    : undefined;
  if (preflight) {
    deps.error(`refused before any call: ${preflight}`);
    return "refused";
  }
  return runPass(deps, live, args);
};

/**
 * The live runner's body, injectable. A bad argument is refused (exit 1)
 * before anything loads; an error thrown once the pass runs is a fault.
 */
export const runLiveMain = async (deps: LiveMainDeps): Promise<LiveOutcome> => {
  try {
    parseLiveArgs(deps.argv);
  } catch (error) {
    deps.error(messageOf(error));
    return "refused";
  }
  try {
    return await runLive(deps);
  } catch (error) {
    deps.error(messageOf(error));
    return "fault";
  }
};
