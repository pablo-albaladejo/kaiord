import type { RepetitionBlock } from "../../../types/krd";
import type { DragHandleProps } from "../StepCard/StepCard";
import { RepetitionBlockHeaderLeft } from "./RepetitionBlockHeaderLeft";
import { RepetitionBlockHeaderRight } from "./RepetitionBlockHeaderRight";

type RepetitionBlockHeaderProps = {
  block: RepetitionBlock;
  isExpanded: boolean;
  isEditingCount: boolean;
  editValue: string;
  onToggleExpand: () => void;
  onEditClick: () => void;
  onSaveCount: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddStep?: () => void;
  onUngroup?: () => void;
  onDelete?: () => void;
  dragHandleProps?: DragHandleProps;
};

export const RepetitionBlockHeader = ({
  block,
  isExpanded,
  isEditingCount,
  editValue,
  onToggleExpand,
  onEditClick,
  onSaveCount,
  onCancelEdit,
  onEditValueChange,
  onKeyDown,
  onAddStep,
  onUngroup,
  onDelete,
  dragHandleProps,
}: RepetitionBlockHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <RepetitionBlockHeaderLeft
        isExpanded={isExpanded}
        isEditingCount={isEditingCount}
        editValue={editValue}
        block={block}
        onToggleExpand={onToggleExpand}
        onEditClick={onEditClick}
        onSaveCount={onSaveCount}
        onCancelEdit={onCancelEdit}
        onEditValueChange={onEditValueChange}
        onKeyDown={onKeyDown}
        dragHandleProps={dragHandleProps}
      />
      <RepetitionBlockHeaderRight
        block={block}
        onEditClick={onEditClick}
        onAddStep={onAddStep}
        onUngroup={onUngroup}
        onDelete={onDelete}
      />
    </div>
  );
};
