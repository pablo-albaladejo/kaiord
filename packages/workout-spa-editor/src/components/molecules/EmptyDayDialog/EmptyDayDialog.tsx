/**
 * EmptyDayDialog - Options when clicking an empty calendar day.
 *
 * Offers "Add from Library" and "Create new workout".
 */

import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, PenLine, X } from "lucide-react";
import { useLocation } from "wouter";

export type EmptyDayDialogProps = {
  date: string | null;
  onClose: () => void;
};

export function EmptyDayDialog({ date, onClose }: EmptyDayDialogProps) {
  const [, navigate] = useLocation();
  const isOpen = date !== null;

  const handleLibrary = () => {
    onClose();
    navigate("/library");
  };

  const handleCreate = () => {
    onClose();
    navigate(`/workout/new?date=${date}`);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
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
                onClick={handleLibrary}
                className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <BookOpen className="h-5 w-5" />
                Add from Library
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <PenLine className="h-5 w-5" />
                Create new workout
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
