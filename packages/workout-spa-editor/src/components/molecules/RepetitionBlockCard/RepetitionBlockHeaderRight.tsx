import * as Tooltip from "@radix-ui/react-tooltip";
import { Trash } from "lucide-react";
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
                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-600 dark:text-red-400"
                aria-label="Delete repetition block"
                data-testid="delete-block-button"
              >
                <Trash className="h-5 w-5" />
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
