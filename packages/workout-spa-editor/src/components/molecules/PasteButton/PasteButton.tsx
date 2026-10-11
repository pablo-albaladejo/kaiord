import { ClipboardPaste } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";

type PasteButtonProps = {
  onPaste: () => void;
  className?: string;
};

export function PasteButton({ onPaste, className = "" }: PasteButtonProps) {
  const t = useTranslate("editor");
  const handlePaste = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPaste();
  };

  return (
    <Button
      variant="secondary"
      onClick={handlePaste}
      aria-label={t("paste.aria")}
      data-testid="paste-step-button"
      className={className}
    >
      <ClipboardPaste className="mr-2 h-4 w-4" />
      {t("paste.label")}
    </Button>
  );
}
