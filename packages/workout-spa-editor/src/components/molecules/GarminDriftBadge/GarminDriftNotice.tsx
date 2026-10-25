import { useId } from "react";

import { garminDateDrift } from "../../../application/garmin-placement/garmin-date-drift";
import { useGarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import { Button } from "../../atoms/Button";
import { PlacementFeedback } from "../GarminPushButton/PlacementFeedback";
import { useGarminPlacement } from "../GarminPushButton/useGarminPlacement";
import { useGarminDriftSentence } from "./GarminDriftBadge";
import {
  type UpdateGarminReason,
  useUpdateGarminReason,
} from "./use-update-garmin-reason";

/** The send control's own reasons, plus the calendar write it lacks. */
const REASON_KEY: Record<UpdateGarminReason, string> = {
  noExtension: "footer.sendDisabled.noExtension",
  signedOut: "footer.sendDisabled.signedOut",
  bridgeOutdated: "garminDrift.bridgeOutdated",
};

export type GarminDriftNoticeProps = {
  workout: WorkoutRecord;
  /** The workout's Garmin ledger row, read by the surface's live query. */
  placementRow: ExportLedgerEntry | undefined;
  locked: boolean;
  /** Render the run's outcome here; the detail's send control already does. */
  withFeedback?: boolean;
};

/**
 * "Garmin still on {date}" and Update Garmin (design §3.11, AC-19, AC-20).
 * Update runs the ordinary placement move — schedule, verify, delete — and
 * records its outcome in the record's shared placement notice. The state
 * clears when the ledger shows Garmin on the workout's day.
 */
export function GarminDriftNotice({
  workout,
  placementRow,
  locked,
  withFeedback = false,
}: GarminDriftNoticeProps) {
  const t = useTranslate("workout-detail");
  const reasonId = useId();
  const drift = garminDateDrift(placementRow, workout, { locked });
  const sentence = useGarminDriftSentence(drift);
  const notice = useGarminPlacementNotice(
    workout.id,
    placementRow,
    workout.date
  );
  const placement = useGarminPlacement(workout, notice);
  const reason = useUpdateGarminReason();
  const feedback = withFeedback && placement.result && (
    <PlacementFeedback
      result={placement.result}
      date={workout.date}
      removable={placement.removable}
      onConfirm={() => void placement.confirm()}
      onSendAnyway={() => void placement.sendAnyway()}
      onDismiss={(id) => void placement.dismiss(id)}
    />
  );
  if (!drift) return feedback || null;
  return (
    <div
      data-testid="garmin-drift-notice"
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <span className="text-ink-strong">{sentence}</span>
      <Button
        size="sm"
        variant="secondary"
        loading={placement.busy}
        disabled={reason !== undefined || placement.busy}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => void placement.send()}
      >
        {t("garminDrift.update")}
      </Button>
      {reason && (
        <p id={reasonId} className="w-full text-xs text-ink-muted">
          {t(REASON_KEY[reason])}
        </p>
      )}
      {feedback}
    </div>
  );
}
