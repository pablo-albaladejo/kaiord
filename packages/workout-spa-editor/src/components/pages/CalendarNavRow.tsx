/**
 * Week navigation, the view switch and the per-source sync buttons — the row
 * that stays on screen whatever the week's status banners are doing.
 */
import type { useCoachingActivities } from "../../hooks/use-coaching-activities";
import type { CalendarView } from "../../types/user-preferences";
import { formatWeekLabel } from "../../utils/format-week-label";
import { CalendarViewToggle } from "../molecules/CalendarViewToggle/CalendarViewToggle";
import { CoachingSyncButton } from "../molecules/CoachingCard/CoachingSyncButton";
import { WeekNavigation } from "../molecules/WorkoutCard/WeekNavigation";

const syncFromFirstDay = <T,>(
  sync: (day: T) => unknown,
  days: readonly T[]
): void => {
  const firstDay = days[0];
  if (firstDay !== undefined) sync(firstDay);
};

export type CalendarNavRowProps = {
  weekId: string;
  days: readonly string[];
  coaching: ReturnType<typeof useCoachingActivities>;
  view?: CalendarView;
  onViewChange?: (next: CalendarView) => void;
};

export function CalendarNavRow({
  weekId,
  days,
  coaching,
  view,
  onViewChange,
}: CalendarNavRowProps) {
  return (
    <div className="flex items-center justify-between">
      <WeekNavigation weekId={weekId} weekLabel={formatWeekLabel(weekId)} />
      <div className="flex items-center gap-2">
        {view && onViewChange && (
          <CalendarViewToggle view={view} onToggle={onViewChange} />
        )}
        {coaching.syncSources
          .filter((src) => src.linked)
          .map((src) => (
            <CoachingSyncButton
              key={src.id}
              connected={src.connected}
              loading={src.loading}
              error={src.error}
              onSync={() => syncFromFirstDay(src.sync, days)}
              onConnect={src.connect}
              label={src.label}
              lastSyncedAt={src.lastSyncedAt}
              routeInactive={src.routeActive === false}
            />
          ))}
      </div>
    </div>
  );
}
