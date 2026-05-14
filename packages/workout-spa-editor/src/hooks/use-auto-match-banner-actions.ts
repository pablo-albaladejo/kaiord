import { useCallback } from "react";

import type { MatchSuggestion } from "../application/match-suggestion";
import { useDismissAutoMatchBanner } from "./use-dismiss-auto-match-banner";
import { useMatchSession } from "./use-match-session";

export type AutoMatchBannerActions = {
  onAccept: (s: MatchSuggestion) => Promise<void>;
  onReject: (s: MatchSuggestion) => Promise<void>;
};

export function useAutoMatchBannerActions(
  profileId: string | null,
  weekStart: string
): AutoMatchBannerActions {
  const matchSession = useMatchSession();
  const dismiss = useDismissAutoMatchBanner();

  const onAccept = useCallback(
    async (s: MatchSuggestion): Promise<void> => {
      if (!profileId) return;
      await matchSession({
        profileId,
        coachingActivityId: s.activityId,
        workoutId: s.workoutId,
        source: "auto-suggestion",
      });
    },
    [profileId, matchSession]
  );

  const onReject = useCallback(
    async (s: MatchSuggestion): Promise<void> => {
      if (!profileId || !weekStart) return;
      await dismiss({
        profileId,
        weekStart,
        activityId: s.activityId,
        workoutId: s.workoutId,
      });
    },
    [profileId, weekStart, dismiss]
  );

  return { onAccept, onReject };
}
