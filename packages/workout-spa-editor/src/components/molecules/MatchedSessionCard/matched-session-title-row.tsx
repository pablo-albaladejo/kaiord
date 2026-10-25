import { LifecycleChip } from "../CardShell/LifecycleChip";
import { MovedFromChip } from "../MovedFromChip/MovedFromChip";
import { renderTitleRow } from "./matched-session-rows";
import {
  formatPercent,
  hasFiniteCompliance,
  type MatchedSession,
} from "./matched-session-text";

export function MatchedTitleRow({
  session,
  compact,
}: {
  session: MatchedSession;
  compact: boolean;
}) {
  return (
    <>
      {renderTitleRow(session)}
      <MovedFromChip workout={session.workout} compact={compact} />
      {hasFiniteCompliance(session.complianceScore) && (
        <LifecycleChip label={formatPercent(session.complianceScore)} />
      )}
    </>
  );
}
