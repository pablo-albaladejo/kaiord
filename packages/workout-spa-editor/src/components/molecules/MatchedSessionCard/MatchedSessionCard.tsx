/**
 * A planned session joined to what was actually done.
 *
 * The lateral border encodes the executed workout's dominant training zone,
 * like every other calendar card; compliance is a percentage in a chip, not a
 * border hue. The four-bucket amber/mid/emerald border it used to carry said
 * "how close was this to plan" in colours that read as good and bad — a
 * judgement the number itself makes, more precisely and in one channel.
 *
 * Compact density collapses to a single row showing only the actual
 * workout's title and duration; the planned title is preserved in the
 * tooltip and aria-label so the planned context is recoverable without
 * opening the dialog. Comfortable density renders both Plan and Actual rows.
 */

import type { CalendarView } from "../../../types/user-preferences";
import { CardShell } from "../CardShell/CardShell";
import { LifecycleChip } from "../CardShell/LifecycleChip";
import { zoneBorderClass } from "../CardShell/status-tokens";
import { useSessionZones } from "../WorkoutCard/use-session-zones";
import { ZONE_BAR_HEIGHT } from "../ZoneProfileBar/zone-bar-height";
import { ZoneProfileBar } from "../ZoneProfileBar/ZoneProfileBar";
import { ExecutedRows } from "./matched-session-executed-row";
import {
  renderComfortableMetadata,
  renderComfortableSecondary,
  renderCompactMetadata,
  renderTitleRow,
} from "./matched-session-rows";
import {
  buildAriaLabel,
  buildTooltip,
  formatPercent,
  hasFiniteCompliance,
  type MatchedSession,
} from "./matched-session-text";

export type { MatchedSession };

export type MatchedSessionCardProps = {
  session: MatchedSession;
  view?: CalendarView;
  density?: "compact" | "comfortable";
  onClick?: (activity: MatchedSession["activity"]) => void;
};

export function MatchedSessionCard({
  session,
  view,
  density = "compact",
  onClick,
}: MatchedSessionCardProps) {
  const executed = session.executed ?? [];
  const zones = useSessionZones(session.workout);
  return (
    <CardShell
      borderClass={zoneBorderClass(zones.dominant)}
      ariaLabel={buildAriaLabel(session)}
      tooltip={buildTooltip(session)}
      onClick={() => onClick?.(session.activity)}
      testId={`matched-card-${session.activity.id}`}
      originChip={`${session.activity.sourceBadge} + ${session.activity.sport.icon}`}
      titleRow={
        <>
          {renderTitleRow(session)}
          {hasFiniteCompliance(session.complianceScore) && (
            <LifecycleChip label={formatPercent(session.complianceScore)} />
          )}
        </>
      }
      zoneBar={
        <ZoneProfileBar
          segments={zones.segments}
          height={ZONE_BAR_HEIGHT[view ?? "grid"]}
        />
      }
      metadataRow={
        density === "comfortable"
          ? renderComfortableMetadata(session)
          : renderCompactMetadata(session)
      }
      secondaryRow={
        density === "comfortable"
          ? renderComfortableSecondary(session)
          : undefined
      }
      footerRow={
        executed.length > 0 ? <ExecutedRows executed={executed} /> : undefined
      }
    />
  );
}
