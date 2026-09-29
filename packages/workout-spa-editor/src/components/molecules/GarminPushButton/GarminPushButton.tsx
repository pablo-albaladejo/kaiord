import { useLiveQuery } from "dexie-react-hooks";
import { Upload } from "lucide-react";
import { useParams } from "wouter";

import { db } from "../../../adapters/dexie/dexie-database";
import { useGarminBridge } from "../../../contexts";
import type { GarminPlacementNotice } from "../../../hooks/use-garmin-placement-notice";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button } from "../../atoms/Button";
import { PlacementFeedback } from "./PlacementFeedback";
import { PushFeedback } from "./PushFeedback";
import { useGarminPlacement } from "./useGarminPlacement";

/**
 * The editor's single send control.
 *
 * It no longer decides whether the watch is reachable — `useGarminGate` owns
 * that, and `EditorStateRibbon` only mounts this button once the chain is
 * intact. Returning `null` on a missing extension is what kept the most
 * common failure off the screen.
 *
 * `onSent` fires with the Garmin library workout id iff the library push
 * is confirmed; the record's placement notice (its ledger row and the last
 * run's outcome, owned by the ribbon) is shown next to it.
 */
export const GarminPushButton: React.FC<{
  notice: GarminPlacementNotice;
  onSent?: (garminWorkoutId: string) => void;
}> = ({ notice, onSent }) => {
  const t = useTranslate("common");
  const { pushing, setPushing } = useGarminBridge();
  const { id } = useParams<{ id?: string }>();
  const workout = useLiveQuery(
    () => (id ? db.table<WorkoutRecord>("workouts").get(id) : undefined),
    [id]
  );
  const placement = useGarminPlacement(workout, notice, onSent);
  const isLoading = placement.busy || pushing.status === "loading";

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="cta"
        onClick={() => void placement.send()}
        loading={isLoading}
        disabled={isLoading}
        data-testid="send-to-garmin-button"
      >
        <Upload className="h-4 w-4" />
        {t("verbs.send")}
      </Button>
      {placement.result && workout ? (
        <PlacementFeedback
          result={placement.result}
          date={workout.date}
          removable={placement.removable}
          onConfirm={() => void placement.confirm()}
          onSendAnyway={() => void placement.sendAnyway()}
          onDismiss={(id) => void placement.dismiss(id)}
        />
      ) : (
        <PushFeedback
          push={pushing}
          onReset={() => setPushing({ status: "idle" })}
        />
      )}
    </div>
  );
};
