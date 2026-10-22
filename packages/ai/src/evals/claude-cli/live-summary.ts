import { homedir } from "node:os";
import type { Calibration } from "./calibration-call";
import { COST_LABEL, liveReportSchema } from "./live-report";
import type { LiveReport } from "./live-report";
import type { CaseTally } from "./live-pass";
import type { LiveSession } from "./live-session";

export type SummaryInput = {
  suite: string;
  modelId: string;
  startedAt: Date;
  repetitions: number;
  session: LiveSession;
  calibration: Calibration;
  tallies: Array<CaseTally>;
  /** Replaced by `~` in every free-text reason; the user's home by default. */
  home?: string;
};

/** A reason may carry a path from an error message; the home part goes. */
export const scrubHome = (text: string, home: string = homedir()): string =>
  home.length > 1 ? text.split(home).join("~") : text;

export const buildLiveReport = (input: SummaryInput): LiveReport => {
  const scrub = (text: string) => scrubHome(text, input.home);
  const stop = input.session.stopped();
  return liveReportSchema.parse({
    schemaVersion: 1,
    suite: input.suite,
    provider: "anthropic",
    modelId: input.modelId,
    cliVersion: input.calibration.ok
      ? input.calibration.run.init.cliVersion
      : null,
    startedAt: input.startedAt.toISOString(),
    repetitions: input.repetitions,
    callsMade: input.session.callsMade(),
    calibrationInputTokens: input.calibration.ok
      ? input.calibration.overheadTokens
      : null,
    cost: {
      label: COST_LABEL,
      apiEquivalentUsd: input.session.apiEquivalentCostUsd(),
    },
    stop: stop ? { kind: stop.kind, reason: scrub(stop.reason) } : null,
    cases: input.tallies.map((c) => ({ ...c, reasons: c.reasons.map(scrub) })),
  });
};

const measured = (report: LiveReport) =>
  report.cases.reduce((n, c) => n + c.passed + c.failed, 0);

const stopLine = (report: LiveReport): string => {
  const { stop } = report;
  if (!stop) return "Pass completed";
  const line = `Pass stopped (${stop.kind}): ${stop.reason}`;
  const onLimit = stop.kind === "budget" || stop.kind === "rate-limit";
  return onLimit && measured(report) === 0
    ? `${line}\nNo case was measured: the pass stopped on its ${stop.kind} before any case ran`
    : line;
};

/** Counts per case, k of n; no rate and no verdict for the pass as a whole. */
export const formatLiveSummary = (report: LiveReport): string => {
  const lines = report.cases.map(
    (c) =>
      `${c.id}: ${c.passed}/${c.runs} passed, ${c.failed} failed, ${c.unmeasured} unmeasured` +
      (c.reasons.length > 0 ? `\n    ${c.reasons.join("\n    ")}` : "")
  );
  return [
    `Live pass: ${report.suite} with ${report.provider}/${report.modelId}`,
    ...lines,
    `Model calls: ${report.callsMade}`,
    `${report.cost.label}: $${report.cost.apiEquivalentUsd.toFixed(4)}`,
    stopLine(report),
  ].join("\n");
};
