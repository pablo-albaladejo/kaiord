import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { usePersistScratch } from "./use-persist-scratch";

export type ScratchScheduleButtonProps = { date: string };

/**
 * Scratch-local "Save & schedule" control. Lives inside
 * `ScratchEditorSurface` (never the shared `WorkoutSection`) so it cannot
 * leak into the id-loaded editor. Renders disabled until a profile is
 * active and a workout is loaded; the click is the only persist trigger.
 */
export function ScratchScheduleButton({ date }: ScratchScheduleButtonProps) {
  const t = useTranslate("editor");
  const { canSchedule, schedule } = usePersistScratch(date);

  return (
    <Button
      variant="primary"
      disabled={!canSchedule}
      onClick={() => void schedule()}
      data-testid="scratch-schedule-button"
    >
      {t("scratch.saveAndSchedule")}
    </Button>
  );
}
