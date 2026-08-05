import { Trash2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";

type DeleteButtonProps = {
  stepIndex: number;
  onDelete: (stepIndex: number) => void;
};

export function DeleteButton({ stepIndex, onDelete }: DeleteButtonProps) {
  const t = useTranslate("editor");
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(stepIndex);
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-full p-2 bg-surface border border-edge-soft text-ink-muted transition-colors duration-200 hover:border-[var(--danger-border)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:ring-offset-2 motion-reduce:transition-none"
      aria-label={t("stepCard.deleteAria", { n: stepIndex + 1 })}
      title={t("stepCard.deleteTitle")}
      data-testid="delete-step-button"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
