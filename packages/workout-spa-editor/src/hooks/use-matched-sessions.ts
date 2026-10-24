/**
 * Reactive read of plan↔execution matches for the current profile and
 * visible week.
 *
 * Read budget per render is bounded: one `useLiveQuery` over
 * `session_matches` filtered by `(profileId, day in days)`, then one
 * `bulkGet` on `coachingActivities` and one on `workouts` to hydrate
 * the matched sides, plus the week's coach activities and their matches
 * dated in another week (`queryCrossWeekMatches`, design §3.6). The hook does not subscribe to those child
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
import { useMemo } from "react";

import type { MatchedSession } from "../components/molecules/MatchedSessionCard/MatchedSessionCard";
import { usePersistence } from "../contexts/persistence-context";
import type { SessionMatch } from "../types/session-match";
import {
  type CrossWeekMatches,
  NO_CROSS_WEEK,
  queryCrossWeekMatches,
} from "./use-matched-sessions-cross-week";
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

export type MatchedWeek = {
  matched: MatchedSessionWithMetadata[];
  crossWeek: CrossWeekMatches;
};

type HydrateResult = MatchedWeek & { dangling: DanglingMatch[] };

const EMPTY: HydrateResult = {
  matched: [],
  dangling: [],
  crossWeek: NO_CROSS_WEEK,
};

export function useMatchedSessions(
  profileId: string | null,
  days: string[]
): MatchedWeek | undefined {
  const persistence = usePersistence();
  const { matchedSessionsReadModel } = persistence;
  const result = useLiveQuery<HydrateResult>(async () => {
    markUseMatchedSessionsStart();
    try {
      if (!profileId || days.length === 0) return EMPTY;
      const [matches, crossWeek] = await Promise.all([
        queryMatchesForWeek(profileId, days),
        queryCrossWeekMatches(persistence, profileId, days),
      ]);
      if (matches.length === 0) return { ...EMPTY, crossWeek };
      const hydrated = await hydrateMatchedSessions(
        matches,
        matchedSessionsReadModel
      );
      return { ...hydrated, crossWeek };
    } finally {
      markUseMatchedSessionsEnd();
    }
  }, [profileId, days.join(","), persistence]);

  useMatchedSessionsHeal(result?.dangling ?? null);

  return useMemo(
    () => result && { matched: result.matched, crossWeek: result.crossWeek },
    [result]
  );
}
