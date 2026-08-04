/**
 * Compact card for executed workouts on the calendar week view.
 *
 * Visual contract is shared with CoachingActivityCard and MatchedSessionCard
 * via CardShell: the 4 px lateral border is the session's dominant training
 * zone, and a session with no classifiable structure keeps the neutral edge —
 * "Process all with AI" is what gives a raw card its colour. The lifecycle is
 * a word in a chip, never the border and never a hue-coded glyph.
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { CalendarView } from "../../../types/user-preferences";
import { CardShell } from "../CardShell/CardShell";
import { LifecycleChip } from "../CardShell/LifecycleChip";
import { zoneBorderClass } from "../CardShell/status-tokens";
import { ZONE_BAR_HEIGHT } from "../ZoneProfileBar/zone-bar-height";
import { ZoneProfileBar } from "../ZoneProfileBar/ZoneProfileBar";
import { deriveWorkoutLifecycle } from "./session-lifecycle";
import { SessionLifecycleBadges } from "./SessionLifecycleBadges";
import { useSessionZones } from "./use-session-zones";
import { formatDuration, lifecycleTone } from "./workout-card-utils";

export type WorkoutCardProps = {
  workout: WorkoutRecord;
  view?: CalendarView;
  onClick: (workout: WorkoutRecord) => void;
};

export function WorkoutCard({ workout, view, onClick }: WorkoutCardProps) {
  const t = useTranslate("calendar");
  const title = workout.raw?.title ?? workout.sport;
  const duration = workout.raw?.duration;
  const lifecycle = deriveWorkoutLifecycle(workout);
  const zones = useSessionZones(workout);
  const stateLabel = t(`lifecycle.${workout.state}`);

  return (
    <CardShell
      borderClass={zoneBorderClass(zones.dominant)}
      ariaLabel={`${title}, ${workout.sport}, ${stateLabel}`}
      onClick={() => onClick(workout)}
      testId={`workout-card-${workout.id}`}
      originChip={workout.source}
      titleRow={
        <>
          <span className="min-w-0 flex-1">{title}</span>
          <LifecycleChip
            label={stateLabel}
            tone={lifecycleTone(workout.state)}
            testId="state-indicator"
          />
        </>
      }
      zoneBar={
        <ZoneProfileBar
          segments={zones.segments}
          height={ZONE_BAR_HEIGHT[view ?? "grid"]}
        />
      }
      metadataRow={
        <>
          <span>{workout.sport}</span>
          {duration && <span>{formatDuration(duration.value)}</span>}
          <SessionLifecycleBadges flags={lifecycle} />
        </>
      }
    />
  );
}
