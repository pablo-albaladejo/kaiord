import { forwardRef, useState } from "react";

import { isPlacementSent } from "../../../application/garmin-placement/placement-result";
import { useGarminBridge } from "../../../contexts";
import { useGarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import type { ButtonSize } from "../../atoms/Button";
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
    const notice = useGarminPlacementNotice(
      workout?.id,
      placementRow,
      workout?.date
    );
    const placement = useGarminPlacement(workout, notice);
    const { extensionInstalled, sessionActive } = useGarminBridge();
    const [ran, setRan] = useState(false);
    // A success whose date the workout left is dropped by the notice, so
    // the send reopens and nothing claims the new date.
    const { result } = placement;
    const sent = ran && result !== undefined && isPlacementSent(result);
    const status: PushStatus = placement.busy
      ? "pushing"
      : sent
        ? "done"
        : "idle";

    const onPush = async () => {
      await placement.send().catch(() => undefined);
      setRan(true);
    };

    return (
      <div className={`flex flex-col gap-2 ${full ? "w-full" : ""}`}>
        <PushButtonFace
          ref={ref}
          status={status}
          size={size}
          full={full}
          onPush={() => void onPush()}
          disabled={!extensionInstalled || !sessionActive}
        />
        {result && workout && (
          <PlacementFeedback
            result={result}
            date={workout.date}
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
