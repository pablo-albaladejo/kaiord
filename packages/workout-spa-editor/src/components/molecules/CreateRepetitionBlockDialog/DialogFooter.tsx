import { Button } from "../../atoms/Button/Button";

type DialogFooterProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function DialogFooter({ onCancel, onConfirm }: DialogFooterProps) {
  return (
    <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
      <Button
        variant="secondary"
        onClick={onCancel}
        data-testid="cancel-create-block-button"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={onConfirm}
        data-testid="confirm-create-block-button"
      >
        Create Block
      </Button>
    </div>
  );
}
