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
