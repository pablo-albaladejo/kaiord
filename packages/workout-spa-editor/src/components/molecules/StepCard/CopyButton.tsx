import { Clipboard } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";

type CopyButtonProps = {
  stepIndex: number;
  onCopy: (stepIndex: number) => void;
};

export function CopyButton({ stepIndex, onCopy }: CopyButtonProps) {
  const t = useTranslate("editor");
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(stepIndex);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-full p-2 bg-surface border border-edge-soft text-ink-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-ink-strong focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 motion-reduce:transition-none"
      aria-label={t("stepCard.copyAria", { n: stepIndex + 1 })}
      title={t("stepCard.copyTitle")}
      data-testid="copy-step-button"
    >
      <Clipboard className="h-4 w-4" />
    </button>
  );
}
