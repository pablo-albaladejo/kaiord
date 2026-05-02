/**
 * Pure helpers for the auto-match dismissal use cases. Extracted so the
 * use-case file stays under the per-file lint cap.
 */

import type { AutoMatchDismissedPair } from "../types/auto-match-dismissal";

export const DISMISSED_PAIRS_CAP = 256;
export const CAP_WARNING_MESSAGE = "dismissAutoMatchBanner: cap reached";

export type DismissalPairInputs = {
  profileId: string;
  weekStart: string;
  activityId: string;
  workoutId: string;
};

const isPresent = (s: unknown): s is string =>
  typeof s === "string" && s.length > 0;

export const allPresent = (input: DismissalPairInputs): boolean =>
  isPresent(input.profileId) &&
  isPresent(input.weekStart) &&
  isPresent(input.activityId) &&
  isPresent(input.workoutId);

export const upsertPair = (
  pairs: AutoMatchDismissedPair[],
  next: AutoMatchDismissedPair
): { pairs: AutoMatchDismissedPair[]; capExceeded: boolean } => {
  const idx = pairs.findIndex(
    (p) => p.activityId === next.activityId && p.workoutId === next.workoutId
  );
  if (idx >= 0) {
    const copy = pairs.slice();
    copy[idx] = next;
    return { pairs: copy, capExceeded: false };
  }
  if (pairs.length >= DISMISSED_PAIRS_CAP) {
    return { pairs, capExceeded: true };
  }
  return { pairs: [...pairs, next], capExceeded: false };
};
