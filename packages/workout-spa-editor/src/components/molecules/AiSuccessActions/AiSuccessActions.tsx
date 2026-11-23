import { Pencil, RotateCcw, Trash2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { CapabilityGate } from "../../atoms/CapabilityGate/CapabilityGate";
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
  const t = useTranslate("create-workout");
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-edge bg-surface p-3"
      data-testid="ai-success-actions"
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={onRegenerate}
        data-testid="ai-action-regenerate"
      >
        <RotateCcw className="h-4 w-4" />
        {t("result.regenerate")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onEdit}
        data-testid="ai-action-edit"
      >
        <Pencil className="h-4 w-4" />
        {t("result.edit")}
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={onDiscard}
        data-testid="ai-action-discard"
      >
        <Trash2 className="h-4 w-4" />
        {t("result.discard")}
      </Button>
      <CapabilityGate id="templates">
        <SaveToLibraryButton workout={workout} />
      </CapabilityGate>
    </div>
  );
}
