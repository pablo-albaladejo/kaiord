/**
 * Stale Conflict Dialog
 *
 * Shows when a STALE workout has user edits conflicting
 * with updated raw content. Offers three options:
 * view diff, re-process, or keep user version.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
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
  const t = useTranslate("library");
  const tCommon = useTranslate("common");
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
              {t("staleDialog.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label={tCommon("actions.close")}>
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-muted-foreground mb-6">
            {t("staleDialog.description")}
          </Dialog.Description>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={onViewDiff}>
              {t("staleDialog.viewDiff")}
            </Button>
            <Button onClick={onReprocess}>{t("staleDialog.reprocess")}</Button>
            <Button variant="tertiary" onClick={onKeepVersion}>
              {t("staleDialog.keepVersion")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
