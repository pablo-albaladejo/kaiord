/**
 * Use cases governing the auto-match banner per-pair dismissal model.
 *
 * Per design D15: dismissals are scoped to `(profileId, weekStart,
 * activityId, workoutId)`. There is no TTL — once a pair lands in
 * `dismissedPairs`, the banner never re-surfaces it for that week on
 * the same device. The dismissal stops applying only when the user
 * navigates to a different week, or when the underlying activity /
 * workout is deleted (cascade hooks remove the entry indirectly).
 *
 * Defensive guards (helpers in `auto-match-dismissal-helpers.ts`):
 *   - empty/undefined inputs are rejected on the write path with
 *     `InvalidInputError`; on the read path they safe-default to
 *     `false` so the banner does not crash the render.
 *   - `dismissedPairs.length` is hard-capped at 256 per row. Re-
 *     dismissing an already-recorded pair updates `dismissedAt` in
 *     place and does NOT count toward the cap; the 257th distinct
 *     pair is a no-op (a static-string warning may be logged).
 *   - Logger / toast first-arguments MUST be static literals per the
 *     project's R-PIIInterpolation guard; the warning string here
 *     deliberately omits any identifier.
 */

import type { AutoMatchDismissalRepository } from "../ports/auto-match-dismissal-repository";
import { InvalidInputError } from "../types/invalid-input-error";
import {
  allPresent,
  CAP_WARNING_MESSAGE,
  upsertPair,
} from "./auto-match-dismissal-helpers";

export type DismissAutoMatchBannerInput = {
  profileId: string;
  weekStart: string;
  activityId: string;
  workoutId: string;
};

export type Logger = {
  warn: (message: string) => void;
};

export type DismissAutoMatchBannerDeps = {
  repository: AutoMatchDismissalRepository;
  clock: () => string;
  logger?: Logger;
};

export async function dismissAutoMatchBanner(
  input: DismissAutoMatchBannerInput,
  deps: DismissAutoMatchBannerDeps
): Promise<void> {
  if (!allPresent(input)) {
    throw new InvalidInputError(
      "dismissAutoMatchBanner requires non-empty profileId, weekStart, activityId, workoutId"
    );
  }

  const existing = await deps.repository.getByProfileAndWeek(
    input.profileId,
    input.weekStart
  );

  const currentPairs = existing?.dismissedPairs ?? [];
  const { pairs, capExceeded } = upsertPair(currentPairs, {
    activityId: input.activityId,
    workoutId: input.workoutId,
    dismissedAt: deps.clock(),
  });

  if (capExceeded) {
    deps.logger?.warn(CAP_WARNING_MESSAGE);
    return;
  }

  await deps.repository.put({
    profileId: input.profileId,
    weekStart: input.weekStart,
    dismissedPairs: pairs,
  });
}

export type IsAutoMatchBannerDismissedInput = {
  profileId: string;
  weekStart: string;
  activityId: string;
  workoutId: string;
};

export type IsAutoMatchBannerDismissedDeps = {
  repository: AutoMatchDismissalRepository;
};

export async function isAutoMatchBannerDismissed(
  input: IsAutoMatchBannerDismissedInput,
  deps: IsAutoMatchBannerDismissedDeps
): Promise<boolean> {
  if (!allPresent(input)) return false;
  const row = await deps.repository.getByProfileAndWeek(
    input.profileId,
    input.weekStart
  );
  if (!row) return false;
  return row.dismissedPairs.some(
    (p) => p.activityId === input.activityId && p.workoutId === input.workoutId
  );
}
