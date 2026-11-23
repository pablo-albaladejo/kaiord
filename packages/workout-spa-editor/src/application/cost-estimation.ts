/**
 * Cost Estimation
 *
 * Estimates the input and output tokens of a batch AI run before it is
 * dispatched, using a chars/3 heuristic for the input plus a fixed output
 * allowance per workout. The batch dialog prices the split at the model's
 * own prices.
 */

import type { WorkoutRecord } from "../types/calendar-record";

const CHARS_PER_TOKEN = 3;
const OUTPUT_TOKEN_ESTIMATE = 500;

export type TokenSplit = { input: number; output: number };

export function estimateTokenSplit(workouts: WorkoutRecord[]): TokenSplit {
  return workouts.reduce<TokenSplit>(
    (total, w) => {
      if (!w.raw) return total;
      const descChars = w.raw.description.length;
      const commentChars = w.raw.comments.reduce(
        (sum, c) => sum + c.text.length,
        0
      );
      return {
        input:
          total.input + Math.ceil((descChars + commentChars) / CHARS_PER_TOKEN),
        output: total.output + OUTPUT_TOKEN_ESTIMATE,
      };
    },
    { input: 0, output: 0 }
  );
}
