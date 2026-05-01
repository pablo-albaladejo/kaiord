/**
 * Per-bucket renderers for DayColumn — kept separate so the top-level
 * component stays under the per-function line cap.
 */

import type { MatchedSessionWithMetadata } from "../../../hooks/use-matched-sessions";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CoachingActivity } from "../../../types/coaching-activity";
import type { CalendarDensity } from "../../../types/user-preferences";
import { CoachingActivityCard } from "../CoachingCard/CoachingActivityCard";
import { MatchedSessionCard } from "../MatchedSessionCard/MatchedSessionCard";
import { WorkoutCard } from "./WorkoutCard";

export type DayCardBuckets = {
  matchedSessions: MatchedSessionWithMetadata[];
  soloPlans: CoachingActivity[];
  soloActuals: WorkoutRecord[];
  density: CalendarDensity;
  onWorkoutClick: (workout: WorkoutRecord) => void;
  onActivityClick?: (activity: CoachingActivity) => void;
};

export function renderDayCards(buckets: DayCardBuckets) {
  return (
    <>
      {buckets.matchedSessions.map((s) => (
        <MatchedSessionCard
          key={s.match.id}
          session={s}
          density={buckets.density}
          onClick={buckets.onActivityClick}
        />
      ))}
      {buckets.soloPlans.map((a) => (
        <CoachingActivityCard
          key={a.id}
          activity={a}
          density={buckets.density}
          onClick={buckets.onActivityClick}
        />
      ))}
      {buckets.soloActuals.map((w) => (
        <WorkoutCard key={w.id} workout={w} onClick={buckets.onWorkoutClick} />
      ))}
    </>
  );
}
