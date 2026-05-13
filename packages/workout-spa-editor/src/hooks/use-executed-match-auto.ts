/**
 * One-shot in-app auto-match for executed activities (e.g., Garmin/FIT)
 * into existing `sessionMatches` slots.
 *
 * Pattern mirrors `useMatchedSessionsHeal`: subscribe to a Dexie live
 * query (matches + workouts for the visible week), recompute candidate
 * appends via the pure `matchExecutedWorkouts` use case, and call the
 * repo method `appendExecutedWorkoutIds` once per `(matchId, workoutId)`
 * via a ref-guarded Set. Single-shot guarantees we never re-fire for
 * the same pair across re-renders.
 */

import { useEffect, useMemo, useRef } from "react";

import { matchExecutedWorkouts } from "../application/coaching/match-executed-workouts";
import { usePersistence } from "../contexts/persistence-context";
import { canonicalizeSport } from "../lib/canonicalize-sport";
import type { WorkoutRecord } from "../types/calendar-record";
import type { SessionMatch } from "../types/session-match";
import type { MatchedSessionWithMetadata } from "./use-matched-sessions";

const fireAppend = (
  matchId: string,
  toAppend: string[],
  append: (id: string, ids: readonly string[]) => Promise<void>
): void => {
  queueMicrotask(() => {
    void append(matchId, toAppend);
  });
};

export const useExecutedMatchAutoForCalendar = (
  rawMatched: readonly MatchedSessionWithMetadata[] | undefined,
  workoutsByDay: Readonly<Record<string, WorkoutRecord[]>>
): void => {
  const matches = useMemo(
    () => (rawMatched ?? []).map((m) => m.match),
    [rawMatched]
  );
  const workouts = useMemo(
    () => Object.values(workoutsByDay).flat(),
    [workoutsByDay]
  );
  useExecutedMatchAuto(matches, workouts);
};

export const useExecutedMatchAuto = (
  matches: readonly SessionMatch[] | null,
  workouts: readonly WorkoutRecord[] | null
): void => {
  const persistence = usePersistence();
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!matches || matches.length === 0 || !workouts || workouts.length === 0)
      return;
    const appends = matchExecutedWorkouts({
      sessionMatches: matches,
      workouts,
      canonicalSport: canonicalizeSport,
    });
    for (const { matchId, toAppend } of appends) {
      const fresh = toAppend.filter(
        (wid) => !firedRef.current.has(`${matchId}:${wid}`)
      );
      if (fresh.length === 0) continue;
      for (const wid of fresh) firedRef.current.add(`${matchId}:${wid}`);
      fireAppend(
        matchId,
        fresh,
        persistence.sessionMatch.appendExecutedWorkoutIds
      );
    }
  }, [matches, workouts, persistence]);
};
