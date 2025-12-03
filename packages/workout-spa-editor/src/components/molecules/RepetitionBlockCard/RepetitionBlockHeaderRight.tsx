import * as Tooltip from "@radix-ui/react-tooltip";
import { Trash2 } from "lucide-react";
import type { RepetitionBlock } from "../../../types/krd";
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
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={onDelete}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded transition-colors"
                aria-label="Delete repetition block"
                data-testid="delete-block-button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded text-sm shadow-lg z-50"
                sideOffset={5}
              >
                Delete repetition block
                <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
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
