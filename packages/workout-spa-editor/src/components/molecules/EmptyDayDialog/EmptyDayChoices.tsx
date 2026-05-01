/**
 * EmptyDayChoices — inner Radix Dialog body for the empty-day picker.
 *
 * Kept separate from EmptyDayDialog so the parent can stay under the
 * frontend max-lines budget while still owning the picker-state and
 * scheduling wiring.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, PenLine, X } from "lucide-react";

type EmptyDayChoicesProps = {
  date: string | null;
  onLibrary: () => void;
  onCreate: () => void;
};

export function EmptyDayChoices({
  date,
  onLibrary,
  onCreate,
}: EmptyDayChoicesProps) {
  return (
    <div data-testid="empty-day-dialog" className="space-y-4">
      <div className="flex items-center justify-between">
        <Dialog.Title className="text-lg font-semibold">
          Add workout
        </Dialog.Title>
        <Dialog.Close asChild>
          <button type="button" aria-label="Close" className="p-1">
            <X className="h-4 w-4" />
          </button>
        </Dialog.Close>
      </div>
      <p className="text-sm text-muted-foreground">
        {formatDateLabel(date ?? "")}
      </p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onLibrary}
          className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <BookOpen className="h-5 w-5" />
          Add from Library
        </button>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <PenLine className="h-5 w-5" />
          Create new workout
        </button>
      </div>
    </div>
  );
}

function formatDateLabel(date: string): string {
  if (!date) return "";
  const d = new Date(date + "T12:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
