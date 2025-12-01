/**
 * DialogActions Component
 *
 * Action buttons for the save to library dialog.
 */

import * as Dialog from "@radix-ui/react-dialog";
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
  return (
    <div className="flex justify-end gap-3">
      <Dialog.Close asChild>
        <Button variant="secondary" disabled={isSaving}>
          Cancel
        </Button>
      </Dialog.Close>
      <Button onClick={onSave} disabled={!isValid || isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
