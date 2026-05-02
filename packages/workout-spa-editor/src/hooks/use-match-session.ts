/**
 * useMatchSession — UI-side wrapper around the `matchSession` use case.
 *
 * Sources every repository through the injected `PersistencePort` so a
 * different adapter cannot accidentally split writes (per PR-A's
 * architectural fix). The whole call runs inside
 * `persistence.transaction(...)` so a mid-write crash leaves the
 * database in the pre-call state.
 *
 * The caller passes `profileId` explicitly — the hook NEVER falls back
 * to `getActiveId()` at submit time. This mirrors the
 * profile-switch-safe pattern documented in `spa-coaching-integration`.
 */

import { useCallback } from "react";

import { matchSession } from "../application/match-session";
import { usePersistence } from "../contexts/persistence-context";
import type { SessionMatchSource } from "../types/session-match";

export type MatchSessionInvocation = {
  profileId: string;
  coachingActivityId: string;
  workoutId: string;
  source?: SessionMatchSource;
};

export function useMatchSession() {
  const persistence = usePersistence();
  return useCallback(
    async (input: MatchSessionInvocation): Promise<void> => {
      await persistence.transaction(async () => {
        await matchSession(
          { ...input, source: input.source ?? "manual" },
          {
            clock: () => new Date().toISOString(),
            idGenerator: () => crypto.randomUUID(),
            repository: persistence.sessionMatch,
            coachingRepository: persistence.coaching,
            workoutRepository: persistence.workouts,
          }
        );
      });
    },
    [persistence]
  );
}
