import { Redo2, Undo2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { Tooltip } from "../../atoms/Tooltip/Tooltip";

export type UndoRedoButtonsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoButtonsProps) {
  const t = useTranslate("editor");
  return (
    <div
      className="flex w-full gap-1 sm:w-auto"
      role="group"
      aria-label={t("history.controlsAria")}
    >
      <Tooltip content={t("history.undoTooltip")} disabled={!canUndo}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={t("history.undoAria")}
          data-testid="undo-button"
          className="w-full sm:w-auto"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content={t("history.redoTooltip")} disabled={!canRedo}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={t("history.redoAria")}
          data-testid="redo-button"
          className="w-full sm:w-auto"
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Tooltip>
    </div>
  );
}
