import { Copy } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";

type DuplicateButtonProps = {
  stepIndex: number;
  onDuplicate: (stepIndex: number) => void;
};

export function DuplicateButton({
  stepIndex,
  onDuplicate,
}: DuplicateButtonProps) {
  const t = useTranslate("editor");
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(stepIndex);
  };

  return (
    <button
      onClick={handleDuplicate}
      className="rounded-full p-2 bg-surface border border-edge-soft text-ink-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-ink-strong focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 motion-reduce:transition-none"
      aria-label={t("stepCard.duplicateAria", { n: stepIndex + 1 })}
      title={t("stepCard.duplicateTitle")}
      data-testid="duplicate-step-button"
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}
