import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { usePersistScratch } from "./use-persist-scratch";

export type ScratchScheduleButtonProps = { date: string };

/**
 * Scratch-local "Save & schedule" control. Lives inside
 * `ScratchEditorSurface` (never the shared `WorkoutSection`) so it cannot
 * leak into the id-loaded editor. Renders disabled until a profile is
 * active and a workout is loaded, and says why when the profile is the
 * missing piece; the click is the only persist trigger.
 */
export function ScratchScheduleButton({ date }: ScratchScheduleButtonProps) {
  const t = useTranslate("editor");
  const { canSchedule, missingProfile, schedule } = usePersistScratch(date);
  const reasonId = "scratch-schedule-reason";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="primary"
        disabled={!canSchedule}
        onClick={() => void schedule()}
        aria-describedby={missingProfile ? reasonId : undefined}
        data-testid="scratch-schedule-button"
      >
        {t("scratch.saveAndSchedule")}
      </Button>
      {missingProfile && (
        <p id={reasonId} className="text-xs text-ink-muted">
          {t("scratch.noProfileReason")}
        </p>
      )}
    </div>
  );
}
