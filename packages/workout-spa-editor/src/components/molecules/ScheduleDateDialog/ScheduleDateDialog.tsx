/**
 * Schedule Date Dialog
 *
 * Simple date picker dialog for scheduling a template to a date.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Calendar, X } from "lucide-react";
import { useState } from "react";

import { Button } from "../../atoms/Button/Button";

type ScheduleDateDialogProps = {
  open: boolean;
  templateName: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
};

export function ScheduleDateDialog({
  open,
  templateName,
  onConfirm,
  onCancel,
}: ScheduleDateDialogProps) {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

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
              Schedule Workout
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Pick a date for &quot;{templateName}&quot;
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
              Cancel
            </Button>
            <Button onClick={() => onConfirm(date)}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
