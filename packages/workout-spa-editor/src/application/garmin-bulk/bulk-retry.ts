/**
 * "Retry" of a finished bulk run (design §3.7, AC-44): only the retryable
 * failures whose `retryAfter` has passed and — once the bridge reports
 * `calendar-write-v1` — the `library-only{bridge-outdated}` items. Every
 * other item keeps its outcome and gets 0 calls.
 */
import { CALENDAR_WRITE_FEATURE } from "../garmin-placement/placement-timing";
import type { WeekPushCandidate } from "./select-week-push-candidates";
import type { BulkOutcome } from "./send-week-to-garmin";

export const isRetryable = (
  outcome: BulkOutcome,
  now: number,
  features: readonly string[]
): boolean => {
  const result = outcome.result;
  if (result?.kind === "failed")
    return result.retryable && (result.retryAfter ?? 0) <= now;
  if (result?.kind === "library-only")
    return (
      result.reason === "bridge-outdated" &&
      features.includes(CALENDAR_WRITE_FEATURE)
    );
  return false;
};

export const retryCandidates = (
  outcomes: readonly BulkOutcome[],
  now: number,
  features: readonly string[]
): WeekPushCandidate[] =>
  outcomes
    .filter((o) => isRetryable(o, now, features))
    .map(({ workoutId, date }) => ({ workoutId, date }));

/** The earliest `retryAfter` still ahead, for the Retry countdown. */
export const nextRetryAt = (
  outcomes: readonly BulkOutcome[],
  now: number
): number | undefined => {
  const ahead = outcomes
    .map((o) => (o.result?.kind === "failed" ? o.result.retryAfter : undefined))
    .filter((at): at is number => at !== undefined && at > now);
  return ahead.length > 0 ? Math.min(...ahead) : undefined;
};

/** The previous outcomes, with each retried item's replaced in place. */
export const mergeOutcomes = (
  previous: readonly BulkOutcome[],
  retried: readonly BulkOutcome[]
): BulkOutcome[] => {
  const byId = new Map(retried.map((o) => [o.workoutId, o]));
  return previous.map((o) => byId.get(o.workoutId) ?? o);
};
