/**
 * WellnessEntryDialog — narrow in-flow surface for hand-entering a day's
 * wellness metrics from the calendar.
 *
 * Radix `Dialog.Root` controlled by parent `useState`. The accessible
 * name MUST include the date so SR users hear the day the dialog is
 * bound to. The body hosts the entry
 * form plus the file-dated import action; a successful save closes it.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useId } from "react";

import {
  DIALOG_CONTENT_CLASSES,
  DIALOG_OVERLAY_CLASSES,
} from "../../organisms/WorkoutLibrary/constants";
import { formatDateLabel } from "../TemplatePickerDialog/format-date-label";
import { WellnessImportAction } from "./wellness-import-action";
import { WellnessEntryForm } from "./WellnessEntryForm";

export type WellnessEntryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
};

export function WellnessEntryDialog({
  open,
  onOpenChange,
  date,
}: WellnessEntryDialogProps) {
  const titleId = useId();
  const dateLabel = formatDateLabel(date);
  const titleText = dateLabel
    ? `Add wellness for ${dateLabel}`
    : "Add wellness";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={undefined}
          className={DIALOG_CONTENT_CLASSES}
          data-testid="wellness-entry-dialog"
        >
          <Dialog.Title
            id={titleId}
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {titleText}
          </Dialog.Title>
          <div className="flex flex-col gap-4">
            <WellnessEntryForm
              date={date}
              onSaved={() => onOpenChange(false)}
            />
            <WellnessImportAction />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
