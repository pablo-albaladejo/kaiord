import { ChevronDown, ChevronRight, GripVertical, Repeat } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { RepetitionBlock } from "../../../types/krd";
import { Icon } from "../../atoms/Icon/Icon";
import type { DragHandleProps } from "../StepCard/StepCard";
import { RepetitionCountEditor } from "./RepetitionCountEditor";

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

const CONTROL_CLASSES =
  "rounded p-1 text-ink-muted transition-colors hover:bg-[var(--bg-sunken)] hover:text-ink-strong motion-reduce:transition-none";

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
  const t = useTranslate("editor");
  return (
    <div className="flex items-center gap-2">
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className={`${CONTROL_CLASSES} cursor-grab touch-none active:cursor-grabbing`}
          aria-label={t("block.dragAria")}
          data-testid="drag-handle"
        >
          <Icon icon={GripVertical} size="sm" color="inherit" />
        </div>
      )}

      <button
        onClick={onToggleExpand}
        className={CONTROL_CLASSES}
        aria-label={isExpanded ? t("block.collapse") : t("block.expand")}
        data-testid="toggle-expand-button"
      >
        <Icon
          icon={isExpanded ? ChevronDown : ChevronRight}
          size="sm"
          color="inherit"
        />
      </button>

      {/* Neutral chip. A repetition groups steps; it is not one more zone,
          and it used to be the loudest object on the screen. */}
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-[var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-ink-strong">
        <Repeat className="h-3 w-3" aria-hidden="true" />
        {t("block.repeat", { count: block.repeatCount })}
      </span>

      <RepetitionCountEditor
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
