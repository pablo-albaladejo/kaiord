/**
 * Stale Conflict Dialog
 *
 * Shows when a STALE workout has user edits conflicting
 * with updated raw content. Offers three options:
 * view diff, re-process, or keep user version.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "../../atoms/Button/Button";

type StaleConflictDialogProps = {
  open: boolean;
  onClose: () => void;
  onReprocess: () => void;
  onKeepVersion: () => void;
  onViewDiff: () => void;
};

export function StaleConflictDialog({
  open,
  onClose,
  onReprocess,
  onKeepVersion,
  onViewDiff,
}: StaleConflictDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          data-testid="stale-conflict-dialog"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Stale Workout Conflict
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-muted-foreground mb-6">
            The source description has changed since you last edited this
            workout. Your edits may conflict with the new content.
          </Dialog.Description>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={onViewDiff}>
              View Diff
            </Button>
            <Button onClick={onReprocess}>Re-process Anyway</Button>
            <Button variant="tertiary" onClick={onKeepVersion}>
              Keep My Version
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
