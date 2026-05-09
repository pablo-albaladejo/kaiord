import { Trash2 } from "lucide-react";

import type { RepetitionBlock } from "../../../types/krd";
import { Tooltip } from "../../atoms/Tooltip";
import { RepetitionBlockContextMenu } from "./RepetitionBlockContextMenu";

type RepetitionBlockHeaderRightProps = {
  block: RepetitionBlock;
  onEditClick: () => void;
  onAddStep?: () => void;
  onUngroup?: () => void;
  onDelete?: () => void;
};

export const RepetitionBlockHeaderRight = ({
  block,
  onEditClick,
  onAddStep,
  onUngroup,
  onDelete,
}: RepetitionBlockHeaderRightProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {block.steps.length} {block.steps.length === 1 ? "step" : "steps"}
      </div>

      {onDelete && (
        <Tooltip content="Delete repetition block" delayDuration={0}>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded transition-colors"
            aria-label="Delete repetition block"
            data-testid="delete-block-button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Tooltip>
      )}

      {(onAddStep || onUngroup || onDelete) && (
        <RepetitionBlockContextMenu
          onEditCount={onEditClick}
          onAddStep={onAddStep || (() => {})}
          onUngroup={onUngroup || (() => {})}
          onDelete={onDelete || (() => {})}
        />
      )}
    </div>
  );
};
