/**
 * Schedule Date Dialog
 *
 * Simple date picker dialog for scheduling a template to a date. The
 * optional copy and `defaultDate` let the workout detail reuse it to move a
 * scheduled workout to another day.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Calendar, X } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { ScheduleDateField } from "./ScheduleDateField";
import { useScheduleDate } from "./use-schedule-date";

type ScheduleDateDialogProps = {
  open: boolean;
  templateName: string;
  /** Proposed on every open; today when the caller has no context day. */
  defaultDate?: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
  copy?: {
    title: string;
    description: string;
    confirm: string;
    cancel: string;
  };
};

export function ScheduleDateDialog({
  open,
  templateName,
  defaultDate,
  onConfirm,
  onCancel,
  copy,
}: ScheduleDateDialogProps) {
  const t = useTranslate("library");
  const { date, invalid, change, confirm } = useScheduleDate(
    open,
    defaultDate,
    onConfirm
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">
              {copy?.title ?? t("scheduleDialog.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label={t("scheduleDialog.close")}>
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {copy?.description ??
              t("scheduleDialog.description", { name: templateName })}
          </p>
          <ScheduleDateField value={date} invalid={invalid} onChange={change} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {copy?.cancel ?? t("scheduleDialog.cancel")}
            </Button>
            <Button onClick={confirm}>
              <Calendar className="mr-2 h-4 w-4" />
              {copy?.confirm ?? t("scheduleDialog.confirm")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
