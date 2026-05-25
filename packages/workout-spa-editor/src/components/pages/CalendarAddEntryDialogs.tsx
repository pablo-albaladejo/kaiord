/**
 * CalendarAddEntryDialogs — mounts the per-day add-entry chooser and the
 * wellness entry dialog, bound to the chooser state on `useCalendarState`.
 */

import { AddEntryChooser } from "../molecules/AddEntryChooser/AddEntryChooser";
import { WellnessEntryDialog } from "../molecules/WellnessEntryDialog/WellnessEntryDialog";
import type { CalendarPageReadyState } from "./use-calendar-page";

export type CalendarAddEntryDialogsProps = {
  s: CalendarPageReadyState["s"];
};

export function CalendarAddEntryDialogs({ s }: CalendarAddEntryDialogsProps) {
  return (
    <>
      <AddEntryChooser
        open={s.addEntryDate !== null}
        onOpenChange={(open) => !open && s.setAddEntryDate(null)}
        date={s.addEntryDate ?? ""}
        onChoose={(choice) =>
          choice === "workout"
            ? s.handleChooseWorkout()
            : s.handleChooseWellness()
        }
      />
      <WellnessEntryDialog
        open={s.wellnessDate !== null}
        onOpenChange={(open) => !open && s.setWellnessDate(null)}
        date={s.wellnessDate ?? ""}
      />
    </>
  );
}
