/**
 * AddEntryChooser — first step of the per-day add-entry flow.
 *
 * Radix `Dialog.Root` controlled by parent `useState` (mirrors
 * `TemplatePickerDialog`). Presents exactly two tiles, Workout and
 * Wellness; choosing one calls `onChoose` so the parent can navigate
 * (workout) or open the wellness entry surface (wellness). The
 * accessible name includes the date so SR users hear the bound day.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useId } from "react";

import {
  DIALOG_CONTENT_CLASSES,
  DIALOG_OVERLAY_CLASSES,
} from "../../organisms/WorkoutLibrary/constants";
import { formatDateLabel } from "../TemplatePickerDialog/format-date-label";

export type AddEntryChoice = "workout" | "wellness";

export type AddEntryChooserProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onChoose: (choice: AddEntryChoice) => void;
};

const TILE_CLASSES =
  "flex flex-1 flex-col items-center gap-1 rounded-lg border border-gray-200 px-4 py-6 text-sm font-medium text-gray-900 transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:border-gray-700 dark:text-white";

export function AddEntryChooser({
  open,
  onOpenChange,
  date,
  onChoose,
}: AddEntryChooserProps) {
  const titleId = useId();
  const dateLabel = formatDateLabel(date);
  const titleText = dateLabel
    ? `Add to ${dateLabel}`
    : "What do you want to add?";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={undefined}
          className={DIALOG_CONTENT_CLASSES}
          data-testid="add-entry-chooser"
        >
          <Dialog.Title
            id={titleId}
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {titleText}
          </Dialog.Title>
          <div className="flex gap-3">
            <button
              type="button"
              data-testid="add-entry-choose-workout"
              className={TILE_CLASSES}
              onClick={() => onChoose("workout")}
            >
              Workout
            </button>
            <button
              type="button"
              data-testid="add-entry-choose-wellness"
              className={TILE_CLASSES}
              onClick={() => onChoose("wellness")}
            >
              Wellness
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
