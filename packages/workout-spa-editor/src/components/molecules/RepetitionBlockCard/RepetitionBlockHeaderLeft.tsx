import { ChevronDown, ChevronRight, GripVertical, Repeat } from "lucide-react";
import { RepetitionCountEditor } from "./RepetitionCountEditor";
import { Badge } from "../../atoms/Badge/Badge";
import { Icon } from "../../atoms/Icon/Icon";
import type { RepetitionBlock } from "../../../types/krd";
import type { DragHandleProps } from "../StepCard/StepCard";

type RepetitionBlockHeaderLeftProps = {
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
  dragHandleProps?: DragHandleProps;
};

export const RepetitionBlockHeaderLeft = ({
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
  dragHandleProps,
}: RepetitionBlockHeaderLeftProps) => {
  return (
    <div className="flex items-center gap-2">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900 rounded transition-colors cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder block"
          data-testid="drag-handle"
        >
          <Icon icon={GripVertical} size="sm" color="primary" />
        </div>
      )}

      <button
        onClick={onToggleExpand}
        className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900 rounded transition-colors"
        aria-label={isExpanded ? "Collapse block" : "Expand block"}
        data-testid="toggle-expand-button"
      >
        <Icon
          icon={isExpanded ? ChevronDown : ChevronRight}
          size="sm"
          color="primary"
        />
      </button>

      <Icon icon={Repeat} size="md" color="primary" />

      <Badge variant="interval" size="md">
        Repeat Block
      </Badge>

      <RepetitionCountEditor
        repeatCount={block.repeatCount}
        isEditing={isEditingCount}
        editValue={editValue}
        onEditClick={onEditClick}
        onSaveCount={onSaveCount}
        onCancelEdit={onCancelEdit}
        onEditValueChange={onEditValueChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};
