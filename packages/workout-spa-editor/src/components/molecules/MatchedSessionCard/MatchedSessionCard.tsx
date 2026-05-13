/**
 * Lateral border encodes the compliance bucket; the actual workout's
 * status icon is the WCAG-conformant signal channel.
 *
 * Compact density collapses to a single row showing only the actual
 * workout's title and duration; the planned title is preserved in the
 * tooltip and aria-label so the planned context is recoverable without
 * opening the dialog. Comfortable density renders both Plan and Actual
 * rows plus the compliance percentage as visible text.
 */

import { complianceBucket } from "../../../application/compliance-bucket";
import { CardShell } from "../CardShell/CardShell";
import { complianceBucketToBorderClass } from "../CardShell/status-tokens";
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
  type MatchedSession,
} from "./matched-session-text";

export type { MatchedSession };

export type MatchedSessionCardProps = {
  session: MatchedSession;
  density?: "compact" | "comfortable";
  onClick?: (activity: MatchedSession["activity"]) => void;
};

export function MatchedSessionCard({
  session,
  density = "compact",
  onClick,
}: MatchedSessionCardProps) {
  const bucket = complianceBucket(session.complianceScore);
  const executed = session.executed ?? [];
  return (
    <CardShell
      borderClass={complianceBucketToBorderClass(bucket)}
      ariaLabel={buildAriaLabel(session)}
      tooltip={buildTooltip(session)}
      onClick={() => onClick?.(session.activity)}
      testId={`matched-card-${session.activity.id}`}
      originChip={`${session.activity.sourceBadge} + ${session.activity.sport.icon}`}
      titleRow={renderTitleRow(session)}
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
