import type { DimensionOutcome, EvalDimension } from "../evals/types";

/**
 * Assert a dimension was actually measured, and hand back its outcome.
 *
 * Without this a test reaches for `outcomes.find(...)` and reads a field off
 * `undefined`, or — worse — finds an `unmeasured` entry and treats it as a
 * verdict. Both turn "nobody measured this" into a green assertion, which is
 * the failure the `unmeasured` union member exists to make impossible. Throw
 * instead, naming the dimension and the reason it was not measured.
 */
export const expectMeasured = (
  outcomes: ReadonlyArray<DimensionOutcome>,
  dimension: EvalDimension
): {
  dimension: EvalDimension;
  status: "passed" | "failed";
  message?: string;
} => {
  const found = outcomes.filter((o) => o.dimension === dimension);
  if (found.length === 0) {
    throw new Error(
      `No outcome for dimension "${dimension}". Declared: ${describe(outcomes)}`
    );
  }
  const measured = found.filter((o) => o.status !== "unmeasured");
  if (measured.length === 0) {
    const reasons = found
      .map((o) => (o.status === "unmeasured" ? o.reason : ""))
      .join("; ");
    throw new Error(
      `Dimension "${dimension}" was not measured: ${reasons}. ` +
        `A test may not read a verdict off a criterion nobody measured.`
    );
  }
  const first = measured[0]!;
  return first.status === "failed"
    ? { dimension, status: "failed", message: first.message }
    : { dimension, status: "passed" };
};

const describe = (outcomes: ReadonlyArray<DimensionOutcome>): string =>
  outcomes.length === 0
    ? "(none)"
    : outcomes.map((o) => `${o.dimension}=${o.status}`).join(", ");
