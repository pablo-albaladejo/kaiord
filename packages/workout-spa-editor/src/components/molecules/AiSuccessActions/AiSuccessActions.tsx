import { Pencil, RotateCcw, Trash2 } from "lucide-react";

import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { SaveToLibraryButton } from "../SaveToLibraryButton/SaveToLibraryButton";

export type AiSuccessActionsProps = {
  workout: KRD;
  onRegenerate: () => void;
  onEdit: () => void;
  onDiscard: () => void;
};

export function AiSuccessActions({
  workout,
  onRegenerate,
  onEdit,
  onDiscard,
}: AiSuccessActionsProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-white/50 p-3 dark:border-blue-700 dark:bg-gray-800/50"
      data-testid="ai-success-actions"
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={onRegenerate}
        data-testid="ai-action-regenerate"
      >
        <RotateCcw className="h-4 w-4" />
        Regenerate
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onEdit}
        data-testid="ai-action-edit"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={onDiscard}
        data-testid="ai-action-discard"
      >
        <Trash2 className="h-4 w-4" />
        Discard
      </Button>
      <SaveToLibraryButton workout={workout} />
    </div>
  );
}
