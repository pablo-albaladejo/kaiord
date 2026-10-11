/**
 * WellnessEntryDialog — narrow in-flow surface for hand-entering a day's
 * wellness metrics, opened from the calendar or from a health page.
 *
 * Radix `Dialog.Root` controlled by parent `useState`. The accessible
 * name MUST include the date so SR users hear the day the dialog is
 * bound to. `focusMetric` opens it on that metric's field. The body hosts
 * the entry form plus the file-dated import action; a successful save
 * closes it.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useId } from "react";

import type { ManualHealthMetric } from "../../../application/health/manual-health-metric";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
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
  focusMetric?: ManualHealthMetric;
};

const focusField = (event: Event, metric: ManualHealthMetric | undefined) => {
  if (!metric) return;
  const content = event.currentTarget as HTMLElement | null;
  const field = content?.querySelector<HTMLInputElement>(
    `[data-wellness-focus="${metric}"]`
  );
  if (!field) return;
  event.preventDefault();
  field.focus();
};

export function WellnessEntryDialog({
  open,
  onOpenChange,
  date,
  focusMetric,
}: WellnessEntryDialogProps) {
  const t = useTranslate("health");
  const titleId = useId();
  const dateLabel = formatDateLabel(date, useActiveLocale());
  const titleText = dateLabel
    ? t("wellnessEntry.title", { date: dateLabel })
    : t("wellnessEntry.titleNoDate");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={undefined}
          className={DIALOG_CONTENT_CLASSES}
          data-testid="wellness-entry-dialog"
          onOpenAutoFocus={(event) => focusField(event, focusMetric)}
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
