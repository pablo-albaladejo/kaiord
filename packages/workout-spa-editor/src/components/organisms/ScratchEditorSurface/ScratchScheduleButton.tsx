import { useState } from "react";
import { useSearch } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { contextDefaultDate } from "../../../utils/context-default-date";
import { getStructuredWorkout } from "../../../utils/structured-workout";
import { Button } from "../../atoms/Button/Button";
import { ScheduleDateDialog } from "../../molecules/ScheduleDateDialog";
import { usePersistScratch } from "./use-persist-scratch";

export type ScratchScheduleButtonProps = { date: string | null };

/**
 * Scratch-local "Save & schedule" control. Lives inside
 * `ScratchEditorSurface` (never the shared `WorkoutSection`) so it cannot
 * leak into the id-loaded editor. Renders disabled until a profile is
 * active and a workout is loaded, and says why when the profile is the
 * missing piece. With a route `date` the click schedules on it; without
 * one it asks, proposing today or the originating week's first day.
 */
export function ScratchScheduleButton({ date }: ScratchScheduleButtonProps) {
  const t = useTranslate("editor");
  const { canSchedule, missingProfile, schedule, workout } =
    usePersistScratch();
  const week = new URLSearchParams(useSearch()).get("week");
  const [asking, setAsking] = useState(false);
  const reasonId = "scratch-schedule-reason";

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="primary"
        disabled={!canSchedule}
        onClick={() => (date ? void schedule(date) : setAsking(true))}
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
      <ScheduleDateDialog
        open={asking}
        templateName={(workout && getStructuredWorkout(workout)?.name) ?? ""}
        defaultDate={contextDefaultDate(week)}
        onConfirm={(picked) => {
          setAsking(false);
          void schedule(picked);
        }}
        onCancel={() => setAsking(false)}
      />
    </div>
  );
}
