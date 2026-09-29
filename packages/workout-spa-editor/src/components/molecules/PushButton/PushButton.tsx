import { forwardRef, useState } from "react";

import { isPlacementSent } from "../../../application/garmin-placement/placement-result";
import { useGarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import type { ButtonSize } from "../../atoms/Button";
import { placementMessage } from "../GarminPushButton/placement-message";
import { PlacementFeedback } from "../GarminPushButton/PlacementFeedback";
import { useGarminPlacement } from "../GarminPushButton/useGarminPlacement";
import { PushButtonFace, type PushStatus } from "./PushButtonFace";

export type PushButtonProps = {
  workout: WorkoutRecord | undefined;
  /** The workout's Garmin ledger row, read by the page's live query. */
  placementRow?: ExportLedgerEntry;
  full?: boolean;
  size?: Extract<ButtonSize, "md" | "lg">;
};

/**
 * The detail page's send control. It shares the editor's placement
 * notice: the ledger-derived `uncertain` and dismissable entries, and the
 * last run's ephemeral outcome (`failed`, `library-only`, a success).
 */
export const PushButton = forwardRef<HTMLButtonElement, PushButtonProps>(
  ({ workout, placementRow, full = false, size = "md" }, ref) => {
    const notice = useGarminPlacementNotice(workout?.id, placementRow);
    const placement = useGarminPlacement(workout, notice);
    // The date the last run sent for: once the workout moves on, the
    // outcome no longer describes its date, so the send reopens.
    const [sentDate, setSentDate] = useState<string>();
    const { result } = placement;
    const sent =
      sentDate === workout?.date &&
      result !== undefined &&
      isPlacementSent(result);
    const status: PushStatus = placement.busy
      ? "pushing"
      : sent
        ? "done"
        : "idle";
    // A message naming the caller's date (a success) is shown only for this
    // control's own run: a reopened page cannot vouch for the workout's date.
    const namesDate = result && placementMessage(result, "").date === "";
    const shown = result && workout && !(namesDate && sentDate === undefined);

    const onPush = async () => {
      const date = workout?.date;
      await placement.send().catch(() => undefined);
      setSentDate(date);
    };

    return (
      <div className={`flex flex-col gap-2 ${full ? "w-full" : ""}`}>
        <PushButtonFace
          ref={ref}
          status={status}
          size={size}
          full={full}
          onPush={() => void onPush()}
        />
        {shown && (
          <PlacementFeedback
            result={result}
            date={sentDate ?? workout.date}
            removable={placement.removable}
            onConfirm={() => void placement.confirm()}
            onSendAnyway={() => void placement.sendAnyway()}
            onDismiss={(id) => void placement.dismiss(id)}
          />
        )}
      </div>
    );
  }
);

PushButton.displayName = "PushButton";
