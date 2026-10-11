import type { Logger, RepetitionBlock, Sport, WorkoutStep } from "@kaiord/core";

import { convertTcxStep } from "./step.converter";

// KRD imports a malformed `Repetitions` (missing, non-integer, < 1) as a
// single pass: the child steps are kept rather than dropped, and the
// substitution is announced as a lossy conversion.
const FALLBACK_REPEAT_COUNT = 1;

// Unrolling multiplies steps by each nested `Repetitions`, so a few bytes of
// TCX could otherwise materialise millions of steps. A nested repeat whose
// copies would push the block past this budget is imported once instead.
export const MAX_UNROLLED_STEPS = 1000;

const REPEAT_STEP_TYPE = "Repeat_t";

const toArray = (value: unknown): Array<Record<string, unknown>> => {
  if (value === undefined || value === null) return [];
  return (Array.isArray(value) ? value : [value]) as Array<
    Record<string, unknown>
  >;
};

export const isTcxRepeat = (tcxStep: Record<string, unknown>): boolean =>
  tcxStep["@_xsi:type"] === REPEAT_STEP_TYPE;

const readRepeatCount = (
  tcxRepeat: Record<string, unknown>,
  logger: Logger
): number => {
  const repetitions = tcxRepeat.Repetitions;
  if (
    typeof repetitions === "number" &&
    Number.isInteger(repetitions) &&
    repetitions >= 1
  ) {
    return repetitions;
  }
  logger.warn(
    "Lossy conversion: TCX repeat has no valid Repetitions, importing its steps once",
    { repetitions, fallback: FALLBACK_REPEAT_COUNT }
  );
  return FALLBACK_REPEAT_COUNT;
};

// KRD repetition blocks hold leaf steps only, so a Repeat_t nested inside
// another is unrolled in place: its children are emitted `Repetitions` times.
// The workout performed is identical; only the nesting is lost.
const collectLeafSteps = (
  tcxRepeat: Record<string, unknown>,
  startIndex: number,
  sport: Sport,
  logger: Logger
): Array<WorkoutStep> => {
  const leaves: Array<WorkoutStep> = [];
  for (const child of toArray(tcxRepeat.Child)) {
    const index = startIndex + leaves.length;
    if (!isTcxRepeat(child)) {
      const step = convertTcxStep(child, index, sport, logger);
      if (step) leaves.push(step);
      continue;
    }
    const count = readRepeatCount(child, logger);
    const inner = collectLeafSteps(child, index, sport, logger);
    if (inner.length === 0) {
      logger.warn(
        "Lossy conversion: nested TCX repeat has no importable steps, dropping it",
        { stepIndex: index, repetitions: count }
      );
      continue;
    }
    const passes =
      leaves.length + count * inner.length > MAX_UNROLLED_STEPS ? 1 : count;
    logger.warn(
      passes === count
        ? "Lossy conversion: nested TCX repeat unrolled into its parent block"
        : "Lossy conversion: nested TCX repeat too large to unroll, importing its steps once",
      { stepIndex: index, repetitions: count }
    );
    for (let pass = 0; pass < passes; pass++) leaves.push(...inner);
  }
  return leaves;
};

/**
 * Converts a TCX `Repeat_t` into a KRD repetition block. Child steps take
 * contiguous `stepIndex` values starting at `startIndex`; the block itself
 * consumes none. Returns null (with a warning) when no child is importable.
 */
export const convertTcxRepeat = (
  tcxRepeat: Record<string, unknown>,
  startIndex: number,
  sport: Sport,
  logger: Logger
): RepetitionBlock | null => {
  logger.debug("Converting TCX repeat", { startIndex });

  const repeatCount = readRepeatCount(tcxRepeat, logger);
  const leaves = collectLeafSteps(tcxRepeat, startIndex, sport, logger);
  if (leaves.length === 0) {
    logger.warn(
      "Lossy conversion: TCX repeat has no importable steps, dropping it",
      { startIndex, repeatCount }
    );
    return null;
  }

  const steps = leaves.map((step, offset) => ({
    ...step,
    stepIndex: startIndex + offset,
  }));
  return { repeatCount, steps };
};
