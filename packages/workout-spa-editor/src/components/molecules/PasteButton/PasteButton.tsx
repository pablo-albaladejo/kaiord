import { ClipboardPaste } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

type PasteButtonProps = {
  onPaste: () => void;
  className?: string;
};

export function PasteButton({ onPaste, className = "" }: PasteButtonProps) {
  const handlePaste = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPaste();
  };

  return (
    <Button
      variant="secondary"
      onClick={handlePaste}
      aria-label="Paste step from clipboard"
      data-testid="paste-step-button"
      className={className}
    >
      <ClipboardPaste className="mr-2 h-4 w-4" />
      Paste Step
    </Button>
  );
}
