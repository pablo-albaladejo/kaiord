/**
 * useDismissAutoMatchBanner — UI-side wrapper around the
 * `dismissAutoMatchBanner` use case. Sources the repository through
 * `usePersistence()` (no direct `db` imports) and runs the write
 * inside `persistence.transaction(...)`.
 */

import { useCallback } from "react";

import { dismissAutoMatchBanner } from "../application/auto-match-dismissal";
import { usePersistence } from "../contexts/persistence-context";

export type DismissBannerInvocation = {
  profileId: string;
  weekStart: string;
  activityId: string;
  workoutId: string;
};

export function useDismissAutoMatchBanner() {
  const persistence = usePersistence();
  return useCallback(
    async (input: DismissBannerInvocation): Promise<void> => {
      await persistence.transaction(async () => {
        await dismissAutoMatchBanner(input, {
          repository: persistence.autoMatchDismissal,
          clock: () => new Date().toISOString(),
        });
      });
    },
    [persistence]
  );
}
