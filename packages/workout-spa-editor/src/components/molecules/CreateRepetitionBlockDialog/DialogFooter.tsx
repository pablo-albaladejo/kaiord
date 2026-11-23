import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

type DialogFooterProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function DialogFooter({ onCancel, onConfirm }: DialogFooterProps) {
  const t = useTranslate("editor");
  return (
    <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
      <Button
        variant="secondary"
        onClick={onCancel}
        data-testid="cancel-create-block-button"
      >
        {t("block.cancel")}
      </Button>
      <Button
        variant="primary"
        onClick={onConfirm}
        data-testid="confirm-create-block-button"
      >
        {t("block.createConfirm")}
      </Button>
    </div>
  );
}
