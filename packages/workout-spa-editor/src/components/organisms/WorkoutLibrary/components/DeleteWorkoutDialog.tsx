/**
 * DeleteWorkoutDialog Component
 *
 * Confirmation dialog for workout deletion from library.
 */

import * as Dialog from "@radix-ui/react-dialog";

import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button/Button";

type DeleteWorkoutDialogProps = {
  open: boolean;
  workoutName: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteWorkoutDialog({
  open,
  workoutName,
  onConfirm,
  onCancel,
}: DeleteWorkoutDialogProps) {
  const t = useTranslate("library");
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-6 shadow-lg sm:rounded-lg dark:border-gray-700 dark:bg-gray-800">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("deleteDialog.title")}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t("deleteDialog.description", { name: workoutName })}
          </Dialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={onConfirm}>{t("actions.delete")}</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
