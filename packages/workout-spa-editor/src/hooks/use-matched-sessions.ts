/**
 * Reactive read of plan↔execution matches for the current profile and
 * visible week.
 *
 * Read budget per render is bounded: one `useLiveQuery` over
 * `session_matches` filtered by `(profileId, day in days)`, then one
 * `bulkGet` on `coachingActivities` and one on `workouts` to hydrate
 * the matched sides. The hook does not subscribe to those child
 * tables itself — the parent calendar page already does, and a
 * separate subscription would defeat the budget.
 *
 * Performance instrumentation: the hook wraps the live query in
 * `performance.mark` / `performance.measure` calls under DEV / test
 * mode only (gated by `import.meta.env`). The Playwright performance
 * spec reads the resulting measure entry to enforce the 30 ms slice
 * of the CalendarPage FCP budget (per design D16). Production builds
 * tree-shake these calls out — see `scripts/check-no-perf-marks-in-prod.mjs`.
 *
 * Returns the same `MatchedSession` shape `MatchedSessionCard`
 * consumes (view-model `CoachingActivity`, not the persistence
 * record) — the record→view-model mapping is platform-aware via
 * the existing train2go mapper.
 */

import { useLiveQuery } from "dexie-react-hooks";

import type { MatchedSession } from "../components/molecules/MatchedSessionCard/MatchedSessionCard";
import { usePersistence } from "../contexts/persistence-context";
import type { SessionMatch } from "../types/session-match";
import {
  type DanglingMatch,
  useMatchedSessionsHeal,
} from "./use-matched-sessions-heal";
import { hydrateMatchedSessions } from "./use-matched-sessions-hydrate";
import {
  markUseMatchedSessionsEnd,
  markUseMatchedSessionsStart,
} from "./use-matched-sessions-perf";
import { queryMatchesForWeek } from "./use-matched-sessions-query";

export type MatchedSessionWithMetadata = MatchedSession & {
  match: SessionMatch;
};

export type { MatchedSession };

type HydrateResult = {
  matched: MatchedSessionWithMetadata[];
  dangling: DanglingMatch[];
};

const EMPTY: HydrateResult = { matched: [], dangling: [] };

export function useMatchedSessions(
  profileId: string | null,
  days: string[]
): MatchedSessionWithMetadata[] | undefined {
  const { matchedSessionsReadModel } = usePersistence();
  const result = useLiveQuery<HydrateResult>(async () => {
    markUseMatchedSessionsStart();
    try {
      if (!profileId || days.length === 0) return EMPTY;
      const matches = await queryMatchesForWeek(profileId, days);
      if (matches.length === 0) return EMPTY;
      return await hydrateMatchedSessions(matches, matchedSessionsReadModel);
    } finally {
      markUseMatchedSessionsEnd();
    }
  }, [profileId, days.join(","), matchedSessionsReadModel]);

  useMatchedSessionsHeal(result?.dangling ?? null);

  return result?.matched;
}
