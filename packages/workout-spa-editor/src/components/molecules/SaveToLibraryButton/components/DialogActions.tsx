/**
 * DialogActions Component
 *
 * Action buttons for the save to library dialog.
 */

import * as Dialog from "@radix-ui/react-dialog";

import { useTranslate } from "../../../../i18n/use-translate";
import { Button } from "../../../atoms/Button/Button";

type DialogActionsProps = {
  onSave: () => void;
  isSaving: boolean;
  isValid: boolean;
};

export function DialogActions({
  onSave,
  isSaving,
  isValid,
}: DialogActionsProps) {
  const t = useTranslate("library");
  return (
    <div className="flex justify-end gap-3">
      <Dialog.Close asChild>
        <Button variant="secondary" disabled={isSaving}>
          {t("actions.cancel")}
        </Button>
      </Dialog.Close>
      <Button onClick={onSave} disabled={!isValid || isSaving}>
        {isSaving ? t("saveDialog.saving") : t("actions.save")}
      </Button>
    </div>
  );
}
