import type { DimensionOutcome, DimensionTally, EvalDimension } from "./types";

export const passed = (dimension: EvalDimension): DimensionOutcome => ({
  dimension,
  status: "passed",
});

export const failed = (
  dimension: EvalDimension,
  message: string
): DimensionOutcome => ({ dimension, status: "failed", message });

export const unmeasured = (
  dimension: EvalDimension,
  reason: string
): DimensionOutcome => ({ dimension, status: "unmeasured", reason });

export const errorsOf = (outcomes: Array<DimensionOutcome>): Array<string> =>
  outcomes.flatMap((o) => (o.status === "failed" ? [o.message] : []));

/** Unmeasured is not a failure: it is the absence of a verdict, not a bad one. */
export const anyFailed = (outcomes: Array<DimensionOutcome>): boolean =>
  outcomes.some((o) => o.status === "failed");

const emptyTally = (): DimensionTally => ({
  measured: 0,
  passed: 0,
  unmeasured: 0,
  reasons: [],
});

export const tallyByDimension = (
  outcomes: Array<DimensionOutcome>
): Record<string, DimensionTally> => {
  const tallies: Record<string, DimensionTally> = {};
  for (const outcome of outcomes) {
    const tally = (tallies[outcome.dimension] ??= emptyTally());
    if (outcome.status === "unmeasured") {
      tally.unmeasured++;
      if (!tally.reasons.includes(outcome.reason)) {
        tally.reasons.push(outcome.reason);
      }
      continue;
    }
    tally.measured++;
    if (outcome.status === "passed") tally.passed++;
  }
  return tallies;
};

/**
 * `null`, not `0` and not `100`, when nothing was measured. A dimension with
 * no measurements has no rate, and returning a number here is how an
 * unmeasured criterion gets compared against a floor as though it had one.
 */
export const dimensionRatePercent = (tally: DimensionTally): number | null =>
  tally.measured === 0 ? null : (tally.passed / tally.measured) * 100;
