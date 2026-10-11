/**
 * Schedule Date Dialog
 *
 * Simple date picker dialog for scheduling a template to a date. The
 * optional copy and `initialDate` let the workout detail reuse it to move a
 * scheduled workout to another day.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Calendar, X } from "lucide-react";
import { useState } from "react";

import { todayIsoDate } from "../../../utils/today-iso-date";
import { Button } from "../../atoms/Button/Button";

type ScheduleDateDialogProps = {
  open: boolean;
  templateName: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
  initialDate?: string;
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
  onConfirm,
  onCancel,
  initialDate,
  copy,
}: ScheduleDateDialogProps) {
  const [date, setDate] = useState(() => initialDate ?? todayIsoDate());

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
              {copy?.title ?? "Schedule Workout"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {copy?.description ?? `Pick a date for "${templateName}"`}
          </p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded border px-3 py-2 mb-4 dark:bg-gray-700 dark:border-gray-600"
            data-testid="schedule-date-input"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {copy?.cancel ?? "Cancel"}
            </Button>
            <Button onClick={() => onConfirm(date)}>
              <Calendar className="mr-2 h-4 w-4" />
              {copy?.confirm ?? "Schedule"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
