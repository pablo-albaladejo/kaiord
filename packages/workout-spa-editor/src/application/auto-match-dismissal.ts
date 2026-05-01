/**
 * Use cases governing the auto-match banner suppression.
 *
 * The 24h expiry is the only TTL — `dismissedAt + DISMISSAL_TTL_MS < now`
 * means the dismissal has lapsed and the banner is allowed to surface
 * again. The boundary is inclusive on the lapsed side: `now === dismissedAt`
 * still counts as dismissed.
 */

import type { AutoMatchDismissalRepository } from "../ports/auto-match-dismissal-repository";
import { DISMISSAL_TTL_MS } from "./auto-match-dismissal-ttl";

export type DismissAutoMatchBannerInput = {
  profileId: string;
  weekStart: string;
};

export type DismissAutoMatchBannerDeps = {
  repository: AutoMatchDismissalRepository;
  clock: () => string;
};

export async function dismissAutoMatchBanner(
  input: DismissAutoMatchBannerInput,
  deps: DismissAutoMatchBannerDeps
): Promise<void> {
  await deps.repository.put({
    profileId: input.profileId,
    weekStart: input.weekStart,
    dismissedAt: deps.clock(),
  });
}

export type IsAutoMatchBannerDismissedInput = {
  profileId: string;
  weekStart: string;
  now: Date;
};

export type IsAutoMatchBannerDismissedDeps = {
  repository: AutoMatchDismissalRepository;
};

export async function isAutoMatchBannerDismissed(
  input: IsAutoMatchBannerDismissedInput,
  deps: IsAutoMatchBannerDismissedDeps
): Promise<boolean> {
  const row = await deps.repository.getByProfileAndWeek(
    input.profileId,
    input.weekStart
  );
  if (!row) return false;
  const dismissedAtMs = new Date(row.dismissedAt).getTime();
  const elapsed = input.now.getTime() - dismissedAtMs;
  return elapsed <= DISMISSAL_TTL_MS;
}
