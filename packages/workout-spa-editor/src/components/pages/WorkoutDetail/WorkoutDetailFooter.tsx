import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { adjustWithAiHref } from "../../../routing/adjust-with-ai-href";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { PushButton } from "../../molecules/PushButton";
import { TrainingPeaksPushButton } from "../../molecules/TrainingPeaksPushButton/TrainingPeaksPushButton";
import { useTrainingPeaksGate } from "../../organisms/EditorStateRibbon/use-trainingpeaks-gate";

export type WorkoutDetailFooterProps = {
  workout: WorkoutRecord | undefined;
  placementRow?: ExportLedgerEntry;
  onEdit: () => void;
};

/**
 * Action bar: ghost "Edit" + "Adjust with AI" + "Send to Garmin", plus
 * "Send to TrainingPeaks" once that destination has an enabled export route.
 * The TrainingPeaks control is gated rather than always-on because most
 * profiles never enable it, and an inert button on a destination the athlete
 * has not connected reads as a broken feature.
 */
export function WorkoutDetailFooter({
  workout,
  placementRow,
  onEdit,
}: WorkoutDetailFooterProps) {
  const t = useTranslate("workout-detail");
  const [, navigate] = useLocation();
  const trainingPeaksGate = useTrainingPeaksGate(workout?.profileId);
  return (
    // items-start: the send hint under the Garmin button must not stretch the
    // buttons beside it. min-w-48 drops the send controls onto their own row
    // when the sheet is phone-width.
    <div
      data-testid="workout-detail-footer"
      className="-mx-4 flex flex-wrap items-start gap-3 border-t border-edge bg-surface-deep px-4 py-3"
    >
      <Button variant="ghost" onClick={onEdit}>
        <Icon icon={ICON_MAP.edit} size="sm" color="inherit" />
        {t("footer.edit")}
      </Button>
      {workout && (
        <Button
          variant="ghost"
          onClick={() => navigate(adjustWithAiHref(workout))}
        >
          <Icon icon={ICON_MAP.chat} size="sm" color="inherit" />
          {t("footer.adjustWithAi")}
        </Button>
      )}
      <div className="min-w-48 flex-1">
        <PushButton workout={workout} placementRow={placementRow} full />
      </div>
      {trainingPeaksGate === "ready" && (
        <div className="min-w-48 flex-1">
          <TrainingPeaksPushButton workout={workout} full />
        </div>
      )}
    </div>
  );
}
