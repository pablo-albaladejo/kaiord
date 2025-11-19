import { ChevronDown, ChevronRight, Repeat } from "lucide-react";
import type { RepetitionBlock } from "../../../types/krd";
import { Badge } from "../../atoms/Badge/Badge";
import { Icon } from "../../atoms/Icon/Icon";
import { RepetitionCountEditor } from "./RepetitionCountEditor";

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
}: RepetitionBlockHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
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

      <div className="text-sm text-gray-600 dark:text-gray-400">
        {block.steps.length} {block.steps.length === 1 ? "step" : "steps"}
      </div>
    </div>
  );
};
