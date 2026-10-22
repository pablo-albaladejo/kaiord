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
};

export const buildLiveReport = (input: SummaryInput): LiveReport =>
  liveReportSchema.parse({
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
    stop: input.session.stopped() ?? null,
    cases: input.tallies,
  });

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
    report.stop
      ? `Pass stopped (${report.stop.kind}): ${report.stop.reason}`
      : "Pass completed",
  ].join("\n");
};
