import type { GenerateRetryReason } from "./progress";
import { AiOutputInvalidError, AiOutputTruncatedError } from "./output-errors";

// A thinking model spends its reasoning from the same budget as the answer,
// so a retry at the budget that just ran out is cut off again: each
// truncation doubles it, up to a ceiling every supported model accepts. The
// ceiling caps growth only: a caller's budget already above it is kept.
const TRUNCATION_GROWTH = 2;
const MAX_OUTPUT_BUDGET = 16384;

export const retryReasonOf = (error: unknown): GenerateRetryReason => {
  if (error instanceof AiOutputTruncatedError) return "truncated";
  if (error instanceof AiOutputInvalidError) return "invalid";
  return "provider";
};

export const nextOutputBudget = (
  budget: number,
  reason: GenerateRetryReason
): number =>
  reason === "truncated"
    ? Math.max(budget, Math.min(budget * TRUNCATION_GROWTH, MAX_OUTPUT_BUDGET))
    : budget;
