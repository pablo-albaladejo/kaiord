/**
 * Cost Estimation
 *
 * Estimates token count and cost for batch AI processing
 * using a chars/3 heuristic plus output overhead.
 */

import type { WorkoutRecord } from "../types/calendar-record";

const CHARS_PER_TOKEN = 3;
const OUTPUT_TOKEN_ESTIMATE = 500;

export function estimateTokens(workouts: WorkoutRecord[]): number {
  return workouts.reduce((total, w) => {
    if (!w.raw) return total;

    const descChars = w.raw.description.length;
    const commentChars = w.raw.comments.reduce(
      (sum, c) => sum + c.text.length,
      0
    );
    const inputTokens = Math.ceil((descChars + commentChars) / CHARS_PER_TOKEN);

    return total + inputTokens + OUTPUT_TOKEN_ESTIMATE;
  }, 0);
}

export function estimateCost(tokens: number, ratePerMillion: number): number {
  return (tokens / 1_000_000) * ratePerMillion;
}
