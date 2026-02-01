import { Redo2, Undo2 } from "lucide-react";
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
  return (
    <div className="flex gap-1" role="group" aria-label="History controls">
      <Tooltip content="Undo (Ctrl+Z)" disabled={!canUndo}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last action"
          data-testid="undo-button"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Tooltip>
      <Tooltip content="Redo (Ctrl+Y)" disabled={!canRedo}>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo last action"
          data-testid="redo-button"
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Tooltip>
    </div>
  );
}
